import { Request, Response } from 'express';
import { prisma } from '../config/database';
import * as tenantIssuePredictionService from '../services/tenantIssuePrediction.service';
import { currentUserId, currentUserRole, isAdmin } from '../utils/rentalAccess';
import { UserRole } from '@prisma/client';
import logger from '../utils/logger';

/**
 * `/api/tenant-issue-prediction` — per-tenant risk predictions.
 *
 * WHY THIS FILE WAS REWRITTEN
 * ---------------------------
 * Zero `req.user` reads. Three defects:
 *
 * 1. `GET /` returned the ENTIRE prediction table — every tenant, every
 *    landlord, no filter. A prediction row carries `issueType` and `likelihood`,
 *    i.e. "likely to be evicted" scored 0.82. That is a cross-tenant disclosure
 *    of the most sensitive derived data in the system.
 *
 * 2. `GET /:id` returned any prediction to anyone.
 *
 * 3. `POST /predict/:tenantId` ran prediction for an ARBITRARY tenant id. Even
 *    when the ML call fails (it usually does — there is no ML service in dev),
 *    the rule-based fallback returns a `risk_score` derived from that tenant's
 *    payment and maintenance history. So the endpoint is an oracle over someone
 *    else's data whether or not the model is reachable.
 *
 * THE TENANCY LINK IS `TenantIssuePrediction.tenantId -> User.id`, NOT a rental.
 * So this cannot use `rentalScopeFilter`. The correct rule, expressed once here:
 *
 *   ADMIN                     -> everything
 *   PROPERTY_MANAGER / OWNER  -> only tenants who hold a Lease on, or an
 *                                Application for, a rental they own
 *   TENANT / USER             -> only their own rows
 *   VENDOR                    -> nothing
 *
 * That mapping is deliberately narrow: a landlord should see predictions about
 * their own tenants' risk of leaving, and nothing about anyone else's.
 */

/**
 * Ids of the rentals an operator owns/manages/created. Used to decide whether a
 * given tenant is "theirs". ADMIN short-circuits before this is called.
 */
async function operatorRentalIds(me: string): Promise<string[]> {
  const rentals = await prisma.rental.findMany({
    where: { OR: [{ managerId: me }, { ownerId: me }, { createdById: me }] },
    select: { id: true },
  });
  return rentals.map((r) => r.id);
}

/**
 * The set of tenant ids whose predictions the caller may see.
 * `null` means "no restriction" (ADMIN); an empty array means "none".
 */
async function visibleTenantIds(req: Request): Promise<string[] | null> {
  if (isAdmin(req)) return null;

  const me = currentUserId(req);
  if (!me) return [];

  const role = currentUserRole(req) as UserRole | undefined;

  // A resident sees their own predictions only.
  if (role === UserRole.TENANT || role === UserRole.USER) return [me];

  if (role !== UserRole.PROPERTY_MANAGER && role !== UserRole.OWNER) {
    // VENDOR and anything unrecognised: no tenant relationships at all.
    return [];
  }

  const rentalIds = await operatorRentalIds(me);
  if (rentalIds.length === 0) return [];

  const [leases, applications] = await Promise.all([
    prisma.lease.findMany({
      where: { rentalId: { in: rentalIds } },
      select: { tenantId: true },
    }),
    prisma.application.findMany({
      where: { rentalId: { in: rentalIds } },
      select: { applicantId: true },
    }),
  ]);

  const ids = new Set<string>();
  for (const l of leases) ids.add(l.tenantId);
  for (const a of applications) ids.add(a.applicantId);
  return [...ids];
}

/** True when the caller may act on predictions for this specific tenant. */
async function canAccessTenant(req: Request, tenantId: string): Promise<boolean> {
  const visible = await visibleTenantIds(req);
  if (visible === null) return true;
  return visible.includes(tenantId);
}

/**
 * Handles the request to get all tenant issue predictions.
 * @param req The request object.
 * @param res The response object.
 */
export const getTenantIssuePredictions = async (req: Request, res: Response) => {
  try {
    const visible = await visibleTenantIds(req);

    // `null` = ADMIN, unrestricted. Otherwise the filter is mandatory: an
    // unscoped list call is a cross-tenant dump, and post-filtering a page would
    // shrink it while reporting an unfiltered total.
    const predictions =
      visible === null
        ? await tenantIssuePredictionService.getTenantIssuePredictions()
        : await prisma.tenantIssuePrediction.findMany({
            where: { tenantId: { in: visible } },
          });

    return res.status(200).json(predictions);
  } catch (error) {
    logger.error(`Error getting tenant issue predictions: ${error}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the request to get a tenant issue prediction by its ID.
 * @param req The request object.
 * @param res The response object.
 */
export const getTenantIssuePredictionById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    const prediction = await tenantIssuePredictionService.getTenantIssuePredictionById(id);
    // Existence before access: a mistyped id is a truthful 404.
    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }
    if (!(await canAccessTenant(req, prediction.tenantId))) {
      return res.status(403).json({ error: 'You do not have access to this prediction' });
    }
    return res.status(200).json(prediction);
  } catch (error) {
    logger.error(`Error getting tenant issue prediction by ID: ${error}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handles the request to predict tenant issues.
 * @param req The request object.
 * @param res The response object.
 */
export const predictTenantIssues = async (req: Request, res: Response) => {
  const { tenantId } = req.params;

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required' });
  }

  try {
    // The tenant must exist before we can say anything about access to them —
    // and a 404 here does not confirm anything an attacker could not get from
    // the id space.
    const tenant = await prisma.user.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (!(await canAccessTenant(req, tenantId))) {
      return res.status(403).json({ error: 'You do not have access to this tenant' });
    }

    const prediction = await tenantIssuePredictionService.predictTenantIssues(tenantId);
    return res.status(200).json(prediction);
  } catch (error) {
    logger.error(`Error predicting tenant issues: ${error}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
