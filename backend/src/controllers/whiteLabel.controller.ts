import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../config/database';
import * as whiteLabelService from '../services/whiteLabel.service';
import {
  canAccessRental,
  canModifyRental,
  currentUserId,
  isAdmin,
} from '../utils/rentalAccess';

/**
 * `/api/white-label` — a branding config attached to one or more `Rental` rows,
 * owned by `WhiteLabelConfig.userId`.
 *
 * WHY THIS FILE WAS REWRITTEN
 * ---------------------------
 * Zero `req.user` reads. Two distinct defects, not one:
 *
 * 1. NO TENANCY. `GET /properties/:propertyId/white-label-config` resolved the
 *    config through the URL id alone, so any authenticated user could read any
 *    landlord's branded-app configuration. Writes mass-assigned `req.body`,
 *    `userId` included, so a caller could claim a config as their own.
 *
 * 2. THE READ LEAKED A SECRET. `WhiteLabelConfig.token` is `@unique` and is the
 *    bearer-style credential for the branded app. The original returned the raw
 *    Prisma row, so the owner's own read — and every unauthorised read — put
 *    that token in the response body. A tenancy check alone would NOT have fixed
 *    this: the leak happened on the legitimate path too. Hence the explicit
 *    `SAFE_WHITE_LABEL_SELECT` projection below, and a test that scans the raw
 *    JSON rather than a known field.
 *
 * OWNERSHIP is checked two ways because the model is genuinely two-headed: the
 * config has its own `userId` (who created it) and a many-to-many `Rental[]`.
 * Either link is enough to read it; a write requires the config's `userId` or
 * ownership of an attached rental.
 */

const RENTAL_ACCESS_INCLUDE = {
  Leases: { select: { tenantId: true } },
  Applications: { select: { applicantId: true } },
} as const;

/**
 * Everything a caller may see. `token` is deliberately absent — it is written
 * once at creation and never read back, exactly like `apiKey`/`apiSecret` on
 * `SyndicationPlatform`.
 */
const SAFE_WHITE_LABEL_SELECT = {
  id: true,
  platform: true,
  userId: true,
  appName: true,
  logoUrl: true,
  primaryColor: true,
  secondaryColor: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** Fields a caller may set. `userId` and `token` are never caller-supplied. */
const WHITE_LABEL_WRITABLE = [
  'appName',
  'logoUrl',
  'primaryColor',
  'secondaryColor',
] as const;

type ConfigWithRentals = {
  userId: string;
  Rental: Array<{
    managerId?: string;
    ownerId?: string;
    createdById?: string;
    Leases?: Array<{ tenantId?: string }>;
    Applications?: Array<{ applicantId?: string }>;
  }>;
};

/** The config creator, or an operator who owns an attached rental. */
function canAccessConfig(
  req: Request,
  config: ConfigWithRentals,
  mode: 'read' | 'write'
): boolean {
  const me = currentUserId(req);
  if (isAdmin(req)) return true;

  const check = mode === 'read' ? canAccessRental : canModifyRental;

  if (me && config.userId === me) {
    // The creator may always read; for writes they must still be an operator —
    // a TENANT who somehow created a config must not keep write access to it.
    return mode === 'read' ? true : config.Rental.some((r) => check(req, r));
  }

  // Otherwise access derives from the rentals the config is attached to.
  return config.Rental.some((r) => check(req, r));
}

async function loadConfig(id: string) {
  return prisma.whiteLabelConfig.findUnique({
    where: { id },
    include: { Rental: { include: RENTAL_ACCESS_INCLUDE } },
  });
}

export const getWhiteLabelConfigByPropertyId = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;

    const rental = await prisma.rental.findUnique({
      where: { id: propertyId },
      include: RENTAL_ACCESS_INCLUDE,
    });
    if (!rental) {
      return res.status(404).json({ message: 'Property not found' });
    }
    if (!canAccessRental(req, rental)) {
      return res.status(403).json({ message: 'You do not have access to this property' });
    }

    // Re-read through the safe projection: the service returns the raw row,
    // which includes `token`.
    const config = await prisma.whiteLabelConfig.findFirst({
      where: { Rental: { some: { id: propertyId } } },
      select: SAFE_WHITE_LABEL_SELECT,
    });

    if (!config) {
      return res.status(404).json({ message: 'No white-label config for this property' });
    }
    return res.status(200).json(config);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const createWhiteLabelConfig = async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const rentalId = body.rentalId as string | undefined;
    const me = currentUserId(req);

    if (!me) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!rentalId) {
      return res.status(400).json({ message: 'rentalId is required' });
    }

    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: RENTAL_ACCESS_INCLUDE,
    });
    if (!rental) {
      return res.status(404).json({ message: 'Property not found' });
    }
    if (!canModifyRental(req, rental)) {
      return res.status(403).json({ message: 'You do not have access to this property' });
    }

    // `userId` is stamped from the token, never read from the body: otherwise a
    // caller can create a config owned by someone else.
    await whiteLabelService.createWhiteLabelConfig({
      appName: body.appName as string,
      logoUrl: body.logoUrl as string,
      primaryColor: body.primaryColor as string,
      secondaryColor: body.secondaryColor as string,
      token: (body.token as string) ?? randomUUID(),
      platform: (body.platform as string) ?? 'web',
      userId: me,
      rentalId,
    });

    // Re-read through the projection so the response never carries `token`.
    const created = await prisma.whiteLabelConfig.findFirst({
      where: { userId: me, Rental: { some: { id: rentalId } } },
      orderBy: { createdAt: 'desc' },
      select: SAFE_WHITE_LABEL_SELECT,
    });
    return res.status(201).json(created);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateWhiteLabelConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const config = await loadConfig(id);
    if (!config) {
      return res.status(404).json({ message: 'White-label config not found' });
    }
    if (!canAccessConfig(req, config, 'write')) {
      return res.status(403).json({ message: 'You do not have access to this config' });
    }

    // `rentalId`, `userId` and `token` are not writable: a PUT must never
    // re-point a config at another landlord's property, re-own it, or rotate the
    // credential behind the owner's back.
    const updateData: Record<string, unknown> = {};
    for (const field of WHITE_LABEL_WRITABLE) {
      if (req.body?.[field] !== undefined) updateData[field] = req.body[field];
    }

    await whiteLabelService.updateWhiteLabelConfig(id, updateData);

    const updated = await prisma.whiteLabelConfig.findUnique({
      where: { id },
      select: SAFE_WHITE_LABEL_SELECT,
    });
    return res.status(200).json(updated);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteWhiteLabelConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const config = await loadConfig(id);
    if (!config) {
      return res.status(404).json({ message: 'White-label config not found' });
    }
    if (!canAccessConfig(req, config, 'write')) {
      return res.status(403).json({ message: 'You do not have access to this config' });
    }

    await whiteLabelService.deleteWhiteLabelConfig(id);
    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
