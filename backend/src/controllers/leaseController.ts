import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  canAccessLease,
  canModifyLease,
  canModifyRental,
  canWriteRentals,
  leaseScopeFilter,
} from '../utils/rentalAccess';

const prisma = new PrismaClient();

/**
 * Lease CRUD.
 *
 * SECURITY MODEL (see utils/rentalAccess.ts)
 * ------------------------------------------
 * The router only applies `authMiddleware.protect`, which establishes WHO the
 * caller is and nothing else. Every ownership decision therefore happens here,
 * after the row is fetched:
 *
 *   - collections are filtered by `leaseScopeFilter` so a landlord sees the
 *     leases under their own rentals and a tenant sees the lease they are on;
 *   - by-id mutations resolve the row, then check `canModifyLease`;
 *   - `tenantId` / `rentalId` are NOT writable: they define the tenancy, so a
 *     `PUT` must not be able to re-point a lease at another tenant or rental.
 *
 * Check order is existence (404) then access (403), so a legitimate owner of a
 * deleted lease gets a truthful "not found" instead of a misleading 403.
 */

/** Fields a client may change. Tenancy keys are deliberately absent. */
const WRITABLE_FIELDS = [
  'startDate',
  'endDate',
  'rentAmount',
  'securityDeposit',
  'leaseTerms',
  'status',
  'signedDate',
  'renewalDate',
] as const;

function pickWritable(body: unknown): Record<string, unknown> {
  const source = (body ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const field of WRITABLE_FIELDS) {
    if (source[field] !== undefined) out[field] = source[field];
  }
  return out;
}

/** Coerce ISO strings to Date so Prisma accepts them from JSON bodies. */
const DATE_FIELDS = new Set<string>([
  'startDate',
  'endDate',
  'signedDate',
  'renewalDate',
]);

function coerce(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  for (const field of DATE_FIELDS) {
    const value = out[field];
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) out[field] = parsed;
    }
  }
  return out;
}

/** Ownership ids needed by `canAccessLease` for an operator. */
const OWNERSHIP_INCLUDE = {
  Rental: { select: { managerId: true, ownerId: true, createdById: true } },
} as const;

class LeaseController {
  async getAllLeases(req: Request, res: Response) {
    try {
      const scope = leaseScopeFilter(req);
      const leases = await prisma.lease.findMany({
        where: scope,
        include: OWNERSHIP_INCLUDE,
      });
      res.status(200).json(leases);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createLease(req: Request, res: Response) {
    try {
      // Creating a lease is a tenancy action — operators only. Residents cannot
      // lease to themselves, and the body must not choose the rental.
      if (!canWriteRentals(req)) {
        res.status(403).json({ error: 'You may not create leases' });
        return;
      }

      const body = req.body ?? {};
      const rentalId = body.rentalId;
      const tenantId = body.tenantId;
      if (!rentalId || !tenantId) {
        res.status(400).json({ error: 'rentalId and tenantId are required' });
        return;
      }

      // The caller must own the rental they are creating a lease against.
      const rental = await prisma.rental.findUnique({
        where: { id: rentalId },
        select: { managerId: true, ownerId: true, createdById: true },
      });
      if (!rental) {
        res.status(404).json({ error: 'Rental not found' });
        return;
      }
      if (!canModifyRental(req, rental)) {
        res.status(403).json({ error: 'You do not have access to this rental' });
        return;
      }

      const lease = await prisma.lease.create({
        data: { ...coerce(pickWritable(body)), rentalId, tenantId } as any,
      });
      res.status(201).json(lease);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getLeaseById(req: Request, res: Response) {
    try {
      const lease = await prisma.lease.findUnique({
        where: { id: req.params.id },
        include: OWNERSHIP_INCLUDE,
      });
      if (!lease) {
        res.status(404).json({ message: 'Lease not found' });
        return;
      }
      if (!canAccessLease(req, lease)) {
        res.status(403).json({ error: 'You do not have access to this lease' });
        return;
      }
      res.status(200).json(lease);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateLease(req: Request, res: Response) {
    try {
      const existing = await prisma.lease.findUnique({
        where: { id: req.params.id },
        include: OWNERSHIP_INCLUDE,
      });
      if (!existing) {
        res.status(404).json({ message: 'Lease not found' });
        return;
      }
      if (!canModifyLease(req, existing)) {
        res.status(403).json({ error: 'You do not have access to this lease' });
        return;
      }

      const lease = await prisma.lease.update({
        where: { id: req.params.id },
        data: coerce(pickWritable(req.body)) as any,
      });
      res.status(200).json(lease);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteLease(req: Request, res: Response) {
    try {
      const existing = await prisma.lease.findUnique({
        where: { id: req.params.id },
        include: OWNERSHIP_INCLUDE,
      });
      if (!existing) {
        res.status(404).json({ message: 'Lease not found' });
        return;
      }
      if (!canModifyLease(req, existing)) {
        res.status(403).json({ error: 'You do not have access to this lease' });
        return;
      }

      await prisma.lease.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new LeaseController();
