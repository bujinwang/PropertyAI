import { Request, Response } from 'express';
import { prisma } from '../config/database';
import VendorPerformanceService from '../services/vendorPerformanceService';
import {
  canAccessRental,
  canModifyRental,
  currentUserId,
  isAdmin,
} from '../utils/rentalAccess';

/**
 * `/api/vendor-performance` — ratings hang off
 * `VendorPerformanceRating.workOrderId -> WorkOrder.maintenanceRequestId ->
 * MaintenanceRequest.rentalId`.
 *
 * TWO REASONS THIS FILE EXISTED IN A BROKEN STATE
 * -----------------------------------------------
 * 1. NO TENANCY. Zero `req.user` reads. `GET /:id`, `GET /vendor/:vendorId`,
 *    `GET /work-order/:workOrderId` and `GET /vendor/:vendorId/average-score`
 *    all returned raw rows to any authenticated caller. A rating carries the
 *    reviewer's free-text `comment` about a vendor, so that is a disclosure of
 *    internal assessments, not just numbers.
 *
 * 2. THE UNBOUND-`this` LANDMINE, ALREADY LIVE. The class was exported as an
 *    INSTANCE and its methods were handed to Express unbound, so `this` was
 *    undefined inside them. `getAverageScoreForVendor` is the only method that
 *    calls `this.getRatingsForVendor(...)` — i.e. it threw a 500 on every single
 *    request while `tsc` stayed perfectly clean. (Same class of bug recorded for
 *    the other controller instances in this codebase.)
 *
 *    Fixed here by converting to module-level functions, as with every other
 *    controller in this repo. `this.` no longer appears anywhere, so the whole
 *    failure mode is structurally impossible rather than merely avoided.
 *
 * READ NARROWNESS IS DELIBERATE. `GET /vendor/:vendorId` fans out across every
 * rental that vendor has ever worked for, so it is resolved per-row and filtered
 * rather than returning the full set. A caller who owns none of those rentals
 * gets a 403, not an empty list — the existence of ratings for that vendor is
 * itself information they are not entitled to.
 */

const RENTAL_ACCESS_INCLUDE = {
  Leases: { select: { tenantId: true } },
  Applications: { select: { applicantId: true } },
} as const;

/** `WorkOrder -> MaintenanceRequest -> Rental` is the tenancy chain. */
const WORK_ORDER_TO_RENTAL_INCLUDE = {
  MaintenanceRequest: { include: { Rental: { include: RENTAL_ACCESS_INCLUDE } } },
} as const;

/** Fields a caller may set. `ratedById` is stamped from the token. */
const RATING_WRITABLE = ['rating', 'comment'] as const;

/**
 * Resolve the rental behind a work order. Returns `null` when the chain cannot
 * be walked, which the callers treat as "not found" rather than "forbidden".
 */
async function rentalForWorkOrder(workOrderId: string) {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: WORK_ORDER_TO_RENTAL_INCLUDE,
  });
  return workOrder?.MaintenanceRequest?.Rental ?? null;
}

/** True when the caller may at least READ the rental behind a work order. */
async function canReadWorkOrder(req: Request, workOrderId: string) {
  const rental = await rentalForWorkOrder(workOrderId);
  if (!rental) return false;
  return canAccessRental(req, rental);
}

export const createRating = async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const vendorId = body.vendorId as string | undefined;
    const workOrderId = body.workOrderId as string | undefined;
    const me = currentUserId(req);

    if (!me) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!vendorId || !workOrderId) {
      return res.status(400).json({ message: 'vendorId and workOrderId are required' });
    }
    if (typeof body.rating !== 'number') {
      return res.status(400).json({ message: 'rating must be a number' });
    }

    // Writing a rating is an operator act on the work order's rental. Without
    // this, anyone can file a rating against any contractor for any job.
    const rental = await rentalForWorkOrder(workOrderId);
    if (!rental) {
      return res.status(404).json({ message: 'Work order not found' });
    }
    if (!canModifyRental(req, rental)) {
      return res.status(403).json({ message: 'You do not have access to this work order' });
    }

    const rating = await VendorPerformanceService.createRating({
      vendorId,
      workOrderId,
      // Placeholder required by the service signature; the schema has no
      // `metricId` column and ignores it.
      metricId: (body.metricId as string) ?? 'overall',
      rating: body.rating as number,
      comment: body.comment as string | undefined,
      // Stamped from the TOKEN, never the body: `ratedById` is an attribution
      // field, and accepting it would let a caller file a review as someone else.
      ratedById: me,
    });
    return res.status(201).json(rating);
  } catch (error: any) {
    // P2002 = `@@unique([vendorId, workOrderId])`: one rating per vendor per job.
    if (error?.code === 'P2002') {
      return res.status(400).json({ message: 'This vendor has already been rated for this job' });
    }
    return res.status(500).json({ error: error.message });
  }
};

export const getRating = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rating = await prisma.vendorPerformanceRating.findUnique({ where: { id } });
    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }
    if (!(await canReadWorkOrder(req, rating.workOrderId))) {
      return res.status(403).json({ message: 'You do not have access to this rating' });
    }
    return res.status(200).json(rating);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getRatingsForVendor = async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const ratings = await VendorPerformanceService.getRatingsForVendor(vendorId);

    // Filter per row instead of trusting one check: a vendor can work for several
    // landlords, and a single rating must not be readable by the wrong one.
    const visible = [];
    for (const rating of ratings) {
      if (await canReadWorkOrder(req, rating.workOrderId)) visible.push(rating);
    }

    // Nothing visible but rows exist => the caller is not entitled to know this
    // vendor has been rated at all.
    if (visible.length === 0 && ratings.length > 0) {
      return res.status(403).json({ message: 'You do not have access to this vendor' });
    }
    return res.status(200).json(visible);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getRatingsForWorkOrder = async (req: Request, res: Response) => {
  try {
    const { workOrderId } = req.params;
    if (!(await canReadWorkOrder(req, workOrderId))) {
      return res.status(403).json({ message: 'You do not have access to this work order' });
    }
    const ratings = await VendorPerformanceService.getRatingsForWorkOrder(workOrderId);
    return res.status(200).json(ratings);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAverageScoreForVendor = async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const ratings = await VendorPerformanceService.getRatingsForVendor(vendorId);

    // Same per-row filter as the list endpoint, so the average only reflects
    // ratings the caller is allowed to see.
    const visible = [];
    for (const rating of ratings) {
      if (await canReadWorkOrder(req, rating.workOrderId)) visible.push(rating);
    }
    if (visible.length === 0) {
      if (ratings.length > 0) {
        return res.status(403).json({ message: 'You do not have access to this vendor' });
      }
      return res.status(200).json({ averageScore: 0 });
    }

    const total = visible.reduce((acc, r) => acc + r.rating, 0);
    return res.status(200).json({ averageScore: total / visible.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
