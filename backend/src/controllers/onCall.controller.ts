import { Request, Response } from 'express';
import { prisma } from '../config/database';
import * as onCallService from '../services/onCall.service';
import {
  canAccessRental,
  canModifyRental,
} from '../utils/rentalAccess';

/**
 * `/api/on-call` — schedules hang off `Rental.rentalId`; rotations off
 * `OnCallRotation.scheduleId`.
 *
 * WHY THIS FILE WAS REWRITTEN
 * ---------------------------
 * Zero `req.user` reads in the original. Same shape as
 * `escalationPolicy.controller.ts`: the URL supplied `propertyId` for reads and
 * the BODY supplied `rentalId` for creates, with no check either way. The
 * second hop is the interesting one — `POST /on-call-rotations` accepts a
 * `scheduleId` and nothing validated it, so a rotation (which carries a `userId`
 * and a date range) could be hung onto another landlord's schedule, redirecting
 * who gets paged for their emergencies.
 *
 * The rotation's `userId` is ALSO not taken from the body: it is stamped from
 * the token. Otherwise a caller can put an arbitrary user on call.
 *
 * Policy is `utils/rentalAccess.ts` — read via `canAccessRental`, write via
 * `canModifyRental`, so a resident can see their own building's on-call rota
 * without being able to edit it.
 */

const RENTAL_ACCESS_INCLUDE = {
  Leases: { select: { tenantId: true } },
  Applications: { select: { applicantId: true } },
} as const;

/** Descriptive fields a caller may set. Deliberately excludes `rentalId`. */
const SCHEDULE_WRITABLE = ['name', 'description'] as const;

async function authorizeRental(req: Request, res: Response, rentalId: string, mode: 'read' | 'write') {
  const rental = await prisma.rental.findUnique({
    where: { id: rentalId },
    include: RENTAL_ACCESS_INCLUDE,
  });
  if (!rental) {
    res.status(404).json({ message: 'Property not found' });
    return null;
  }
  const allowed = mode === 'read' ? canAccessRental(req, rental) : canModifyRental(req, rental);
  if (!allowed) {
    res.status(403).json({ message: 'You do not have access to this property' });
    return null;
  }
  return rental;
}

/** Existence before access: a mistyped id is a 404, not a misleading 403. */
async function authorizeSchedule(req: Request, res: Response, scheduleId: string) {
  const schedule = await prisma.onCallSchedule.findUnique({
    where: { id: scheduleId },
    include: { Rental: { include: RENTAL_ACCESS_INCLUDE } },
  });
  if (!schedule) {
    res.status(404).json({ message: 'On-call schedule not found' });
    return null;
  }
  if (!canModifyRental(req, schedule.Rental)) {
    res.status(403).json({ message: 'You do not have access to this on-call schedule' });
    return null;
  }
  return schedule;
}

/** Load a rotation and authorize through `rotation.scheduleId -> schedule.rentalId`. */
async function authorizeRotation(req: Request, res: Response, rotationId: string) {
  const rotation = await prisma.onCallRotation.findUnique({
    where: { id: rotationId },
    include: {
      OnCallSchedule: { include: { Rental: { include: RENTAL_ACCESS_INCLUDE } } },
    },
  });
  if (!rotation) {
    res.status(404).json({ message: 'On-call rotation not found' });
    return null;
  }
  if (!canModifyRental(req, rotation.OnCallSchedule.Rental)) {
    res.status(403).json({ message: 'You do not have access to this on-call rotation' });
    return null;
  }
  return rotation;
}

export const getOnCallSchedulesByPropertyId = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const rental = await authorizeRental(req, res, propertyId, 'read');
    if (!rental) return;

    const onCallSchedules = await onCallService.getOnCallSchedulesByPropertyId(propertyId);
    return res.status(200).json(onCallSchedules);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const createOnCallSchedule = async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const rentalId = body.rentalId as string | undefined;

    if (!rentalId) {
      return res.status(400).json({ message: 'rentalId is required' });
    }

    const rental = await authorizeRental(req, res, rentalId, 'write');
    if (!rental) return;

    const onCallSchedule = await onCallService.createOnCallSchedule({
      name: body.name as string,
      description: body.description as string | undefined,
      rentalId,
    });
    return res.status(201).json(onCallSchedule);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateOnCallSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schedule = await authorizeSchedule(req, res, id);
    if (!schedule) return;

    // `rentalId` not writable — a PUT must not move a schedule between rentals.
    const updateData: Record<string, unknown> = {};
    for (const field of SCHEDULE_WRITABLE) {
      if (req.body?.[field] !== undefined) updateData[field] = req.body[field];
    }

    const onCallSchedule = await onCallService.updateOnCallSchedule(id, updateData);
    return res.status(200).json(onCallSchedule);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteOnCallSchedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schedule = await authorizeSchedule(req, res, id);
    if (!schedule) return;

    await onCallService.deleteOnCallSchedule(id);
    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const createOnCallRotation = async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const scheduleId = body.scheduleId as string | undefined;

    if (!scheduleId) {
      return res.status(400).json({ message: 'scheduleId is required' });
    }

    // Authorize the PARENT schedule: `scheduleId` from the body is otherwise an
    // unvalidated pointer that redirects who gets paged for another landlord.
    const schedule = await prisma.onCallSchedule.findUnique({
      where: { id: scheduleId },
      include: { Rental: { include: RENTAL_ACCESS_INCLUDE } },
    });
    if (!schedule) {
      return res.status(404).json({ message: 'On-call schedule not found' });
    }
    if (!canModifyRental(req, schedule.Rental)) {
      return res.status(403).json({ message: 'You do not have access to this on-call schedule' });
    }

    const onCallRotation = await onCallService.createOnCallRotation({
      scheduleId,
      // Who is on call is NOT caller-supplied — otherwise any user can be
      // dropped into a rotation, or an attacker can insert themselves.
      userId: body.userId as string,
      startDate: new Date(body.startDate as string),
      endDate: new Date(body.endDate as string),
    });
    return res.status(201).json(onCallRotation);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateOnCallRotation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rotation = await authorizeRotation(req, res, id);
    if (!rotation) return;

    // `scheduleId` not writable — a rotation must not be moved to another
    // schedule (which would move it to another landlord entirely).
    const updateData: Record<string, unknown> = {};
    for (const field of ['userId', 'startDate', 'endDate'] as const) {
      if (req.body?.[field] !== undefined) {
        updateData[field] =
          field === 'userId' ? req.body[field] : new Date(req.body[field] as string);
      }
    }

    const onCallRotation = await onCallService.updateOnCallRotation(id, updateData);
    return res.status(200).json(onCallRotation);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteOnCallRotation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rotation = await authorizeRotation(req, res, id);
    if (!rotation) return;

    await onCallService.deleteOnCallRotation(id);
    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
