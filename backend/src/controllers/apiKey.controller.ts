import { Request, Response } from 'express';
import { User, UserRole } from '@prisma/client';
import * as apiKeyService from '../services/apiKey.service';

/** Roles permitted to manage the API keys of *other* users. */
const PRIVILEGED_ROLES: readonly UserRole[] = [UserRole.ADMIN];

/**
 * Verifies the authenticated principal may act on the given `targetUserId`.
 *
 * Writes a response and returns `false` on failure. Fails closed when the
 * request is unauthenticated. A caller may always act on their own id; acting
 * on someone else's id requires a privileged role.
 */
const authorizeTargetUser = (req: Request, res: Response, targetUserId: string): boolean => {
  const user = (req as any).user as User | undefined;

  if (!user || !user.id) {
    res.status(401).json({ message: 'Not authenticated.' });
    return false;
  }

  if (user.id === targetUserId || PRIVILEGED_ROLES.includes(user.role)) {
    return true;
  }

  res.status(403).json({ message: 'Forbidden: you may only manage your own API keys.' });
  return false;
};

export const generateApiKey = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as User | undefined;

    if (!user || !user.id) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const { userId: bodyUserId, permissions, expiresAt } = req.body;

    // Default to the caller's own id; a provided id must be authorized. This
    // closes anonymous/arbitrary-user key minting while preserving the ability
    // for admins to issue keys on behalf of a user.
    const targetUserId: string = bodyUserId || user.id;

    if (!authorizeTargetUser(req, res, targetUserId)) {
      return;
    }

    const apiKey = await apiKeyService.generateApiKey(targetUserId, permissions, expiresAt);
    res.status(201).json(apiKey);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getApiKeysByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!authorizeTargetUser(req, res, userId)) {
      return;
    }

    const apiKeys = await apiKeyService.getApiKeysByUserId(userId);
    res.status(200).json(apiKeys);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteApiKey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await apiKeyService.getApiKeyById(id);
    if (!existing) {
      return res.status(404).json({ message: 'API key not found.' });
    }

    // Ownership check on the *key's* owner, not a body/param the caller chose.
    if (!authorizeTargetUser(req, res, existing.userId)) {
      return;
    }

    await apiKeyService.deleteApiKey(id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
