import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  canAccessLease,
  canAccessTransaction,
  canModifyTransaction,
  canWriteRentals,
  transactionScopeFilter,
} from '../utils/rentalAccess';

const prisma = new PrismaClient();

/**
 * Transaction CRUD — FINANCIAL RECORDS.
 *
 * SECURITY MODEL (see utils/rentalAccess.ts)
 * ------------------------------------------
 * The router applies only `authMiddleware.protect`. Before this controller
 * enforced tenancy, `GET /api/transactions` ran a bare `findMany()` and returned
 * every payment record in the system to any authenticated user — including a
 * tenant of an unrelated landlord. Worse, `create`/`update` mass-assigned
 * `req.body` (`prisma.transaction.create({ data: req.body })`), so a caller could
 * pick `leaseId`, `amount`, `status` and `approvedById` freely.
 *
 * Rules enforced here:
 *   - the collection is filtered by `transactionScopeFilter`;
 *   - `leaseId` is resolved and access-checked BEFORE insert, so nobody can
 *     record a charge against a lease they do not control;
 *   - `leaseId` is not writable on update — a transaction belongs to its lease;
 *   - `approvedById` is never taken from the body: it is the authenticated user
 *     (or left null), otherwise a caller could forge someone else's approval.
 *
 * Existence (404) is checked before access (403).
 */

/** Fields a client may change. `leaseId` / `approvedById` are deliberately absent. */
const WRITABLE_FIELDS = [
  'amount',
  'type',
  'status',
  'description',
  'transactionDate',
] as const;

function pickWritable(body: unknown): Record<string, unknown> {
  const source = (body ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const field of WRITABLE_FIELDS) {
    if (source[field] !== undefined) out[field] = source[field];
  }
  return out;
}

function coerce(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  const value = out.transactionDate;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) out.transactionDate = parsed;
  }
  return out;
}

/** Ownership ids needed by `canAccessTransaction`. */
const OWNERSHIP_INCLUDE = {
  Lease: {
    include: {
      Rental: { select: { managerId: true, ownerId: true, createdById: true } },
    },
  },
} as const;

/** Everything `canAccessLease` needs to authorize a `leaseId` before insert. */
const LEASE_OWNERSHIP_INCLUDE = {
  Rental: { select: { managerId: true, ownerId: true, createdById: true } },
} as const;

class TransactionController {
  async getAllTransactions(req: Request, res: Response) {
    try {
      const scope = transactionScopeFilter(req);
      const transactions = await prisma.transaction.findMany({
        where: scope,
        include: OWNERSHIP_INCLUDE,
      });
      res.status(200).json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createTransaction(req: Request, res: Response) {
    try {
      if (!canWriteRentals(req)) {
        res.status(403).json({ error: 'You may not record transactions' });
        return;
      }

      const body = req.body ?? {};
      const leaseId = body.leaseId;
      if (!leaseId) {
        res.status(400).json({ error: 'leaseId is required' });
        return;
      }

      // Authorize the TARGET lease before writing a financial row against it.
      const lease = await prisma.lease.findUnique({
        where: { id: leaseId },
        include: LEASE_OWNERSHIP_INCLUDE,
      });
      if (!lease) {
        res.status(404).json({ error: 'Lease not found' });
        return;
      }
      if (!canAccessLease(req, lease)) {
        res.status(403).json({ error: 'You do not have access to this lease' });
        return;
      }

      const transaction = await prisma.transaction.create({
        data: { ...coerce(pickWritable(body)), leaseId } as any,
      });
      res.status(201).json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTransactionById(req: Request, res: Response) {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: req.params.id },
        include: OWNERSHIP_INCLUDE,
      });
      if (!transaction) {
        res.status(404).json({ message: 'Transaction not found' });
        return;
      }
      if (!canAccessTransaction(req, transaction)) {
        res.status(403).json({ error: 'You do not have access to this transaction' });
        return;
      }
      res.status(200).json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateTransaction(req: Request, res: Response) {
    try {
      const existing = await prisma.transaction.findUnique({
        where: { id: req.params.id },
        include: OWNERSHIP_INCLUDE,
      });
      if (!existing) {
        res.status(404).json({ message: 'Transaction not found' });
        return;
      }
      if (!canModifyTransaction(req, existing)) {
        res.status(403).json({ error: 'You do not have access to this transaction' });
        return;
      }

      const transaction = await prisma.transaction.update({
        where: { id: req.params.id },
        data: coerce(pickWritable(req.body)) as any,
      });
      res.status(200).json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteTransaction(req: Request, res: Response) {
    try {
      const existing = await prisma.transaction.findUnique({
        where: { id: req.params.id },
        include: OWNERSHIP_INCLUDE,
      });
      if (!existing) {
        res.status(404).json({ message: 'Transaction not found' });
        return;
      }
      if (!canModifyTransaction(req, existing)) {
        res.status(403).json({ error: 'You do not have access to this transaction' });
        return;
      }

      await prisma.transaction.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new TransactionController();
