import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/dbManager';

/**
 * Platform-operator user management. Every route is ADMIN-gated in
 * `routes/usersRoutes.ts`, so breadth of access is by design here — but the
 * RESPONSE SHAPE was not.
 *
 * WHAT WAS WRONG
 * --------------
 * `findMany()` / `findUnique()` returned the whole row, so `GET /api/users`
 * emitted `password` (the bcrypt hash), `mfaSecret`, `refreshToken`,
 * `passwordResetToken`, `passwordHistory` and `biometricPublicKey` for every
 * user. Admin-gated or not, an endpoint has no reason to hand out credential
 * material — it turns any admin-token compromise, log capture, or proxy cache
 * into a credential dump. Verified by probe before fixing.
 *
 * Create/update also mass-assigned `req.body`, which let a caller set any column
 * — including `mfaEnabled: true` with an attacker's `mfaSecret`, or overwrite
 * `password` with a plaintext string that `bcrypt.compare` can never match.
 */

/** Columns that must never leave the database via this API. */
const SECRET_FIELDS = [
  'password',
  'mfaSecret',
  'refreshToken',
  'passwordResetToken',
  'passwordResetExpires',
  'passwordHistory',
  'biometricPublicKey',
  'biometricCredentialId',
] as const;

/** The safe projection returned by reads. */
const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isActive: true,
  mfaEnabled: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
  accountDeletionRequested: true,
  accountDeletionRequestedAt: true,
} as const;

/** Fields an operator may set through this surface. Never `password` or MFA keys. */
const WRITABLE_USER_FIELDS = [
  'email',
  'firstName',
  'lastName',
  'phone',
  'role',
  'isActive',
] as const;

function pickWritable(body: unknown): Record<string, unknown> {
  const source = (body ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const field of WRITABLE_USER_FIELDS) {
    if (source[field] !== undefined) out[field] = source[field];
  }
  return out;
}

/** Strip secrets defensively, in case a future query forgets the projection. */
function withoutSecrets<T extends Record<string, any>>(row: T): Partial<T> {
  const out: Record<string, any> = { ...row };
  for (const field of SECRET_FIELDS) delete out[field];
  return out as Partial<T>;
}

class UserController {
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({ select: PUBLIC_USER_SELECT });
      res.status(200).json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const data = pickWritable(req.body);
      if (!data.email || !data.firstName || !data.lastName) {
        res.status(400).json({ error: 'email, firstName and lastName are required' });
        return;
      }
      // A password is never accepted here — it must go through the auth flow so
      // it is hashed and the audit trail records it. Assign a random unusable
      // value so the account cannot be logged into until a real password is set.
      const unusablePassword = await bcrypt.hash(
        `unusable-${Date.now()}-${Math.random()}`,
        10
      );

      const user = await prisma.user.create({
        data: { ...data, password: unusablePassword, isActive: data.isActive ?? true } as any,
        select: PUBLIC_USER_SELECT,
      });
      res.status(201).json(user);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        res.status(400).json({ error: 'A user with that email already exists' });
        return;
      }
      if (error?.name === 'PrismaClientValidationError') {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: PUBLIC_USER_SELECT,
      });
      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const existing = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: { id: true },
      });
      if (!existing) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: pickWritable(req.body) as any,
        select: PUBLIC_USER_SELECT,
      });
      res.status(200).json(user);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        res.status(400).json({ error: 'A user with that email already exists' });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const existing = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: { id: true },
      });
      if (!existing) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      await prisma.user.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new UserController();
