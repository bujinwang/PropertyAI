import { Request, Response } from 'express';
import { User, UserRole } from '@prisma/client';
import { complianceService } from '../services/compliance.service';

/**
 * Roles permitted to act on *another* user's compliance records.
 *
 * A caller whose id differs from the target `:userId` must hold one of these
 * roles, otherwise the request is rejected with 403. Keep this list minimal:
 * GDPR/SOC2 self-service endpoints are about the *principal's own* data.
 */
const PRIVILEGED_ROLES: readonly UserRole[] = [UserRole.ADMIN, UserRole.PROPERTY_MANAGER];

/**
 * Fields that must never leave the API, even for the record's owner.
 *
 * `getDataAccessRequest` previously returned the raw Prisma row including the
 * bcrypt `password` hash. Secrets are stripped here as a defence-in-depth layer
 * independent of what the service selects.
 */
const SENSITIVE_FIELDS: readonly string[] = [
  'password',
  'mfaSecret',
  'passwordResetToken',
  'passwordResetExpires',
  'refreshToken',
  'passwordHistory',
];

/** Returns a shallow copy of `record` with every sensitive field removed. */
const stripSensitive = <T extends Record<string, any>>(record: T): Partial<T> => {
  const clone: Record<string, any> = { ...record };
  for (const field of SENSITIVE_FIELDS) {
    if (field in clone) {
      delete clone[field];
    }
  }
  return clone as Partial<T>;
};

/**
 * Enforces that the authenticated principal may act on `targetUserId`.
 *
 * Access is granted only when the caller is the target user themselves or holds
 * a privileged role. On failure an error response is written and `false` is
 * returned so the caller can bail out. Fails closed when unauthenticated.
 */
const authorizeTargetUser = (req: Request, res: Response, targetUserId: string): boolean => {
  const user = (req as any).user as User | undefined;

  if (!user || !user.id) {
    res.status(401).json({ error: 'Not authenticated.' });
    return false;
  }

  if (user.id === targetUserId) {
    return true;
  }

  if (PRIVILEGED_ROLES.includes(user.role)) {
    return true;
  }

  res.status(403).json({ error: 'Forbidden: you may only access your own data.' });
  return false;
};

class ComplianceController {
  async getDataAccessRequest(req: Request, res: Response) {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    if (!authorizeTargetUser(req, res, userId)) {
      return;
    }

    try {
      const data = await complianceService.getDataAccessRequest(userId);
      res.status(200).json(stripSensitive(data as Record<string, any>));
    } catch (error) {
      res.status(500).json({ error: 'Failed to get data access request.' });
    }
  }

  async getDataPortabilityRequest(req: Request, res: Response) {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    if (!authorizeTargetUser(req, res, userId)) {
      return;
    }

    try {
      const data = await complianceService.getDataPortabilityRequest(userId);
      // Strip secrets from the portability export before serialising it.
      res.header('Content-Type', 'application/json');
      res.send(JSON.stringify(stripSensitive(JSON.parse(data) as Record<string, any>), null, 2));
    } catch (error) {
      res.status(500).json({ error: 'Failed to get data portability request.' });
    }
  }

  async getDataErasureRequest(req: Request, res: Response) {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Critical: without this check any authenticated caller could hard-delete
    // an arbitrary account by id (the previous state allowed it anonymously).
    if (!authorizeTargetUser(req, res, userId)) {
      return;
    }

    try {
      await complianceService.getDataErasureRequest(userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to get data erasure request.' });
    }
  }
}

export const complianceController = new ComplianceController();
