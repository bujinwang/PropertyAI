import { Request, Response } from 'express';
import * as applianceService from '../services/appliance.service';
import { prisma } from '../config/database';
import { canAccessRental, canModifyRental } from '../utils/rentalAccess';

/**
 * Appliances belong to a `Rental`. Every handler therefore resolves the parent
 * rental and asks `utils/rentalAccess` whether the caller may touch it.
 *
 * WHAT WAS WRONG
 * --------------
 * These handlers had NO authorization of any kind. They only appeared safe
 * because `app.use('/api', requireAuth)` authenticates the whole `/api` surface
 * before the route barrel mounts — so anyone holding *any* valid token could
 * read, create, update and delete any landlord's appliances.
 *
 * Worse, `updateAppliance` forwarded `req.body` straight to Prisma. The body
 * could therefore carry `rentalId`, which made it possible to move an appliance
 * off one landlord's property onto another's — the tenancy key was writable.
 * It is now stripped: an appliance can never change parent, and only its own
 * descriptive fields may be edited.
 *
 * RESIDENTS
 * ---------
 * A resident can SEE the appliances in the home they lease (they live with
 * them) but cannot add, edit or remove them: those are the landlord's capital
 * assets, not a self-service action. Reporting a fault is what
 * `/api/maintenance` is for.
 */

const RENTAL_OWNERSHIP_SELECT = {
  managerId: true,
  ownerId: true,
  createdById: true,
} as const;

/** Descriptive fields a caller may set. Deliberately excludes `rentalId`. */
const WRITABLE_FIELDS = ['name', 'type'] as const;

function pickWritable(body: unknown): Record<string, unknown> {
  const source = (body ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const field of WRITABLE_FIELDS) {
    if (source[field] !== undefined) out[field] = source[field];
  }
  return out;
}

/** `canAccessRental` expects the Leases/Applications links for residents. */
const asRentalOwnership = (rental: {
  managerId: string | null;
  ownerId: string | null;
  createdById: string | null;
}) => ({ ...rental, Leases: [], Applications: [] });

export const getAppliancesByRentalId = async (req: Request, res: Response) => {
  try {
    const { rentalId } = req.params;

    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      select: RENTAL_OWNERSHIP_SELECT,
    });

    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    if (!canAccessRental(req, asRentalOwnership(rental))) {
      return res.status(403).json({ message: 'You do not have access to this rental' });
    }

    const appliances = await applianceService.getAppliancesByRentalId(rentalId);
    res.status(200).json(appliances);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createAppliance = async (req: Request, res: Response) => {
  try {
    const { rentalId } = (req.body ?? {}) as { rentalId?: string };

    if (!rentalId) {
      return res.status(400).json({ message: 'rentalId is required' });
    }

    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      select: RENTAL_OWNERSHIP_SELECT,
    });

    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    // WRITE check, not the read check: a resident who leases the unit must not
    // be able to add capital assets to it.
    if (!canModifyRental(req, asRentalOwnership(rental))) {
      return res.status(403).json({ message: 'You do not have access to this rental' });
    }

    const appliance = await applianceService.createAppliance({
      ...(pickWritable(req.body) as { name: string; type: string }),
      rentalId,
    });
    res.status(201).json(appliance);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getApplianceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const appliance = await applianceService.getApplianceById(id);
    if (!appliance) {
      return res.status(404).json({ message: 'Appliance not found' });
    }

    const rental = await prisma.rental.findUnique({
      where: { id: appliance.rentalId },
      select: RENTAL_OWNERSHIP_SELECT,
    });

    if (!rental || !canAccessRental(req, asRentalOwnership(rental))) {
      return res.status(403).json({ message: 'You do not have access to this appliance' });
    }

    res.status(200).json(appliance);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAppliance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const appliance = await applianceService.getApplianceById(id);
    if (!appliance) {
      return res.status(404).json({ message: 'Appliance not found' });
    }

    const rental = await prisma.rental.findUnique({
      where: { id: appliance.rentalId },
      select: RENTAL_OWNERSHIP_SELECT,
    });

    if (!rental || !canModifyRental(req, asRentalOwnership(rental))) {
      return res.status(403).json({ message: 'You do not have access to this appliance' });
    }

    // `pickWritable` drops `rentalId` and every other non-whitelisted key, so a
    // PUT can never re-point the appliance at a different property.
    const updated = await applianceService.updateAppliance(id, pickWritable(req.body));
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAppliance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const appliance = await applianceService.getApplianceById(id);
    if (!appliance) {
      return res.status(404).json({ message: 'Appliance not found' });
    }

    const rental = await prisma.rental.findUnique({
      where: { id: appliance.rentalId },
      select: RENTAL_OWNERSHIP_SELECT,
    });

    if (!rental || !canModifyRental(req, asRentalOwnership(rental))) {
      return res.status(403).json({ message: 'You do not have access to this appliance' });
    }

    await applianceService.deleteAppliance(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
