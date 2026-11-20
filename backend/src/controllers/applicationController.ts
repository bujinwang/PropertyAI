import { Request, Response } from 'express';
import { PrismaClient, ApplicationStatus } from '@prisma/client';
import { pushNotificationService } from '../services/pushNotification.service';
import {
  applicationScopeFilter,
  canAccessApplication,
  canAccessRental,
  canModifyApplication,
  canWriteRentals,
  currentUserId,
  isAdmin,
} from '../utils/rentalAccess';

const prisma = new PrismaClient();

/**
 * Rental application CRUD.
 *
 * SECURITY MODEL (see utils/rentalAccess.ts)
 * ------------------------------------------
 * The router applies only `authMiddleware.protect`. Before this controller
 * enforced tenancy, `GET /api/applications` ran a bare `findMany()` and returned
 * every application in the system — including `notes` — to any authenticated
 * user, and `create` was `prisma.application.create({ data: req.body })`, so a
 * caller could file an application as somebody else or attach it to a rental
 * they had nothing to do with.
 *
 * Rules:
 *   - the collection is filtered by `applicationScopeFilter`;
 *   - `applicantId` is server-set to the caller — never taken from the body.
 *     An operator may file ON BEHALF of a named applicant, but only against a
 *     rental they control;
 *   - `PUT` cannot move `rentalId`/`applicantId`; only `status` and `notes` are
 *     writable, and only operators may write at all;
 *   - existence (404) is checked before access (403).
 */

const WRITABLE_FIELDS = ['status', 'notes'] as const;

function pickWritable(body: unknown): Record<string, unknown> {
  const source = (body ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const field of WRITABLE_FIELDS) {
    if (source[field] !== undefined) out[field] = source[field];
  }
  return out;
}

/** Ownership ids needed by the access checks. */
const OWNERSHIP_INCLUDE = {
  Rental: { select: { managerId: true, ownerId: true, createdById: true } },
} as const;

class ApplicationController {
  async getAllApplications(req: Request, res: Response) {
    try {
      const applications = await prisma.application.findMany({
        where: applicationScopeFilter(req),
        include: OWNERSHIP_INCLUDE,
      });
      res.status(200).json(applications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createApplication(req: Request, res: Response) {
    try {
      const userId = currentUserId(req);
      if (!userId) {
        res.status(401).json({ error: 'Not authorized' });
        return;
      }

      const body = req.body ?? {};
      const { rentalId } = body;
      if (!rentalId) {
        res.status(400).json({ error: 'rentalId is required' });
        return;
      }

      // Who is this application FOR? A resident may only apply as themselves.
      // An operator may file on behalf of a named applicant — but only for a
      // rental they control, which the access check below enforces.
      const requestedApplicantId = body.applicantId;
      const applicantId =
        isAdmin(req) && requestedApplicantId ? requestedApplicantId : userId;

      if (!isAdmin(req) && requestedApplicantId && requestedApplicantId !== userId) {
        res.status(403).json({ error: 'You may only apply as yourself' });
        return;
      }

      const rental = await prisma.rental.findUnique({
        where: { id: rentalId },
        select: { managerId: true, ownerId: true, createdById: true },
      });
      if (!rental) {
        res.status(404).json({ error: 'Rental not found' });
        return;
      }

      // Who may apply to which rental:
      //   - a resident applying as THEMSELVES may apply to any rental that
      //     exists — that is the whole point of applying (they do not lease it
      //     yet, so any ownership check would be circular);
      //   - an operator filing on someone's behalf must control the rental;
      //   - an ADMIN may file for anyone, anywhere.
      const filingAsSelf = applicantId === userId;
      if (!filingAsSelf && !isAdmin(req)) {
        if (!canAccessRental(req, { ...rental, Leases: [], Applications: [] })) {
          res.status(403).json({ error: 'You do not have access to this rental' });
          return;
        }
      }

      if (filingAsSelf && !isAdmin(req) && !canWriteRentals(req)) {
        // A resident must at least be applying to a real, currently available
        // rental rather than one already taken off the market.
        const full = await prisma.rental.findUnique({
          where: { id: rentalId },
          select: { isAvailable: true, status: true },
        });
        if (full && (full.isAvailable === false || full.status !== 'ACTIVE')) {
          res.status(400).json({ error: 'This rental is not accepting applications' });
          return;
        }
      }

      const application = await prisma.application.create({
        data: {
          ...pickWritable(body),
          rentalId,
          applicantId,
        } as any,
      });

      // Best-effort notification; a push failure must not fail the request.
      try {
        const applicant = await prisma.user.findUnique({
          where: { id: application.applicantId },
          include: { Device: true },
        });
        if (applicant?.Device && applicant.Device.length > 0) {
          const device = applicant.Device[0];
          const pushToken = device.pushToken || '';
          const platform = device.deviceType || 'android';
          const title = 'Application Received';
          const bodyText = 'Your application has been received and is under review.';
          if (platform === 'ios') {
            await pushNotificationService.sendIOSNotification(pushToken, title, bodyText);
          } else {
            await pushNotificationService.sendAndroidNotification(pushToken, title, bodyText);
          }
        }
      } catch (notifyError) {
        console.warn('Application notification failed (application still created):', notifyError);
      }

      res.status(201).json(application);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        res.status(409).json({ error: 'You have already applied for this rental' });
        return;
      }
      if (error?.code === 'P2003' || error?.name === 'PrismaClientValidationError') {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  }

  async getApplicationById(req: Request, res: Response) {
    try {
      const application = await prisma.application.findUnique({
        where: { id: req.params.id },
        include: OWNERSHIP_INCLUDE,
      });
      if (!application) {
        res.status(404).json({ message: 'Application not found' });
        return;
      }
      if (!canAccessApplication(req, application)) {
        res.status(403).json({ error: 'You do not have access to this application' });
        return;
      }
      res.status(200).json(application);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateApplication(req: Request, res: Response) {
    try {
      const existing = await prisma.application.findUnique({
        where: { id: req.params.id },
        include: OWNERSHIP_INCLUDE,
      });
      if (!existing) {
        res.status(404).json({ message: 'Application not found' });
        return;
      }
      if (!canModifyApplication(req, existing)) {
        res.status(403).json({ error: 'You do not have access to this application' });
        return;
      }

      const data = pickWritable(req.body);
      if (data.status !== undefined) {
        const valid = Object.values(ApplicationStatus) as string[];
        if (!valid.includes(String(data.status))) {
          res.status(400).json({ error: 'Invalid status' });
          return;
        }
      }

      const application = await prisma.application.update({
        where: { id: req.params.id },
        data: data as any,
      });
      res.status(200).json(application);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteApplication(req: Request, res: Response) {
    try {
      const existing = await prisma.application.findUnique({
        where: { id: req.params.id },
        include: OWNERSHIP_INCLUDE,
      });
      if (!existing) {
        res.status(404).json({ message: 'Application not found' });
        return;
      }
      if (!canModifyApplication(req, existing)) {
        res.status(403).json({ error: 'You do not have access to this application' });
        return;
      }

      await prisma.application.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ApplicationController();
