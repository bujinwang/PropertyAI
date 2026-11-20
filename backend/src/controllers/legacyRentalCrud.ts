import { Request, Response } from 'express';
import {
  rentalService,
  CreateRentalDto,
  UpdateRentalDto,
  RentalFilterParams,
} from '../services/rentalService';
import { canAccessRental, canModifyRental, rentalScopeFilter } from '../utils/rentalAccess';

/**
 * Shared CRUD implementation behind the restored `/api/properties` and
 * `/api/units` endpoints.
 *
 * WHY A SHARED ADAPTER
 * --------------------
 * The schema has NO `Property` and NO `Unit` model. Both concepts were
 * consolidated into `Rental` (migration `20250804155618_rental`); the two
 * controllers used to answer 410 Gone on every verb via `deprecatedResponse`.
 * Restoring CRUD therefore cannot mean resurrecting those models — the only
 * honest implementation is to expose `Rental` through both legacy paths.
 * Keeping that mapping in ONE place stops the two controllers from drifting.
 *
 * These are module-level functions, deliberately NOT class methods. Controllers
 * in this repo are handed to Express unbound (`router.post('/x', ctrl.method)`),
 * so any `this.x()` inside a handler would throw at runtime while typechecking
 * stays clean.
 *
 * SECURITY — DIFFERENT FROM /api/rentals ON PURPOSE
 * -------------------------------------------------
 * `rentalController.createRental` copies caller-supplied `managerId`, `ownerId`
 * and `createdById` straight into the row, so any authenticated user can point
 * a rental at someone else. A newly restored write path must not reproduce a
 * known hole. Here those three fields are ALWAYS overwritten with `req.user.id`
 * (the global `app.use('/api', requireAuth)` hydrates the full User row), and
 * they are excluded from the update whitelist so ownership cannot be moved via
 * PUT either. Request bodies are picked from a whitelist of scalar `Rental`
 * fields: unknown keys (e.g. the legacy `name`, or a nested injection object)
 * are dropped instead of reaching Prisma and producing a 500.
 */

/** Scalar `Rental` fields a client is allowed to write. Mirrors schema.prisma:513. */
const WRITABLE_FIELDS = [
  'title',
  'description',
  'address',
  'city',
  'state',
  'zipCode',
  'country',
  'latitude',
  'longitude',
  'propertyType',
  'yearBuilt',
  'totalUnits',
  'amenities',
  'unitNumber',
  'floorNumber',
  'size',
  'bedrooms',
  'bathrooms',
  'rent',
  'deposit',
  'availableDate',
  'isAvailable',
  'leaseTerms',
  'slug',
  'isActive',
  'status',
] as const;

/** Fields required to create a Rental. The three ownership ids are server-set. */
const REQUIRED_CREATE_FIELDS = [
  'title',
  'address',
  'city',
  'state',
  'zipCode',
  'propertyType',
  'rent',
] as const;

// Kept as literals (rather than importing the generated Prisma enums) so this
// adapter has no generated-client dependency beyond the service it delegates
// to. Values mirror prisma/schema.prisma:1061 and :1091.
const VALID_STATUSES = ['ACTIVE', 'PENDING', 'DRAFT', 'ARCHIVED'];
const VALID_PROPERTY_TYPES = [
  'APARTMENT',
  'HOUSE',
  'CONDO',
  'TOWNHOUSE',
  'COMMERCIAL',
  'INDUSTRIAL',
  'OTHER',
];

type JsonBody = Record<string, unknown>;

/** Pick only whitelisted keys. Also guards against array / non-object bodies. */
function pickWritable(body: unknown, fields: readonly string[]): JsonBody {
  const out: JsonBody = {};
  if (!body || typeof body !== 'object' || Array.isArray(body)) return out;
  const source = body as JsonBody;
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      out[field] = source[field];
    }
  }
  return out;
}

function currentUserId(req: Request): string | undefined {
  // `req.user` comes from @types/passport's global augmentation; requireAuth
  // assigns a hydrated User row (see middleware/requireAuth.ts:175).
  return (req.user as unknown as { id?: string } | undefined)?.id;
}

function errorResponse(res: Response, error: any, fallback: string): Response {
  const status = Number(error?.status) || 500;
  if (status >= 500) console.error(fallback, error);
  return res.status(status).json({
    status: 'error',
    message: error?.message || fallback,
    ...(error?.code ? { code: error.code } : {}),
  });
}

/** Reject enum strings that would otherwise turn into a Prisma 500. */
function validateEnums(data: JsonBody): string | null {
  if (data.propertyType !== undefined && !VALID_PROPERTY_TYPES.includes(String(data.propertyType))) {
    return `Invalid propertyType. Expected one of: ${VALID_PROPERTY_TYPES.join(', ')}`;
  }
  if (data.status !== undefined && !VALID_STATUSES.includes(String(data.status))) {
    return `Invalid status. Expected one of: ${VALID_STATUSES.join(', ')}`;
  }
  return null;
}

/** GET collection — returns `{ data: [...] }`, matching the legacy contract. */
export async function listRentals(req: Request, res: Response): Promise<Response> {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '10'), 10) || 10));

    const filters: RentalFilterParams = {};
    if (req.query.city) filters.city = String(req.query.city);
    if (req.query.state) filters.state = String(req.query.state);
    if (req.query.zipCode) filters.zipCode = String(req.query.zipCode);
    if (req.query.propertyType && VALID_PROPERTY_TYPES.includes(String(req.query.propertyType))) {
      filters.propertyType = String(req.query.propertyType) as any;
    }
    if (req.query.status && VALID_STATUSES.includes(String(req.query.status))) {
      filters.status = String(req.query.status) as any;
    }
    if (req.query.isAvailable !== undefined) {
      filters.isAvailable = String(req.query.isAvailable) === 'true';
    }

    // Tenancy: without a scope this listed EVERY rental in the database to any
    // authenticated caller. Same policy as /api/rentals (utils/rentalAccess.ts).
    const scope = rentalScopeFilter(req);

    const result = await rentalService.getRentals(
      filters,
      page,
      limit,
      'createdAt',
      'desc',
      scope as Record<string, unknown> | undefined
    );
    return res.status(200).json({
      status: 'success',
      data: result.rentals,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    return errorResponse(res, error, 'Failed to list rentals');
  }
}

/** POST collection — 201 with `{ data: { id, ... } }`. */
export async function createRentalFromLegacy(req: Request, res: Response): Promise<Response> {
  const userId = currentUserId(req);
  if (!userId) {
    return res.status(401).json({ status: 'error', message: 'Authentication required' });
  }

  const data = pickWritable(req.body, WRITABLE_FIELDS);
  const missing = REQUIRED_CREATE_FIELDS.filter(
    (field) => data[field] === undefined || data[field] === null || data[field] === ''
  );
  if (missing.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields',
      missingFields: missing,
    });
  }

  const enumError = validateEnums(data);
  if (enumError) {
    return res.status(400).json({ status: 'error', message: enumError });
  }

  // Ownership is NEVER taken from the request body.
  const payload = {
    ...data,
    managerId: userId,
    ownerId: userId,
    createdById: userId,
  } as CreateRentalDto;

  try {
    const rental = await rentalService.createRental(payload);
    return res.status(201).json({
      status: 'success',
      message: 'Created successfully',
      data: rental,
    });
  } catch (error: any) {
    return errorResponse(res, error, 'Failed to create rental');
  }
}

/** GET /:id — 404 when the row does not exist, 403 when it is not the caller's. */
export async function getRentalByIdLegacy(req: Request, res: Response): Promise<Response> {
  try {
    const rental = await rentalService.getRentalById(req.params.id);
    if (!rental) {
      return res.status(404).json({ status: 'error', message: 'Rental not found' });
    }
    if (!canAccessRental(req, rental)) {
      return res.status(403).json({ status: 'error', message: 'You do not have access to this rental' });
    }
    return res.status(200).json({ status: 'success', data: rental });
  } catch (error: any) {
    return errorResponse(res, error, 'Failed to get rental');
  }
}

/** Core update logic, shared by the full and the narrow (availability) PUTs. */
async function performUpdate(
  id: string,
  rawBody: unknown,
  res: Response,
  req: Request
): Promise<Response> {
  try {
    const existing = await rentalService.getRentalById(id);
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Rental not found' });
    }

    // `req` is required solely for the tenancy decision — it needs the
    // authenticated user, which the row alone cannot tell us.
    if (!canModifyRental(req, existing)) {
      return res.status(403).json({ status: 'error', message: 'You do not have access to this rental' });
    }

    const data = pickWritable(rawBody, WRITABLE_FIELDS);
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ status: 'error', message: 'No writable fields supplied' });
    }

    const enumError = validateEnums(data);
    if (enumError) {
      return res.status(400).json({ status: 'error', message: enumError });
    }

    const rental = await rentalService.updateRental(id, data as UpdateRentalDto);
    return res.status(200).json({
      status: 'success',
      message: 'Updated successfully',
      data: rental,
    });
  } catch (error: any) {
    return errorResponse(res, error, 'Failed to update rental');
  }
}

/** PUT /:id — ownership ids are not in the whitelist, so they cannot be moved. */
export async function updateRentalFromLegacy(req: Request, res: Response): Promise<Response> {
  return performUpdate(req.params.id, req.body, res, req);
}

/** PUT /:id/availability — narrow update, not a full replace. */
export async function setAvailabilityFromLegacy(req: Request, res: Response): Promise<Response> {
  const { isAvailable } = (req.body || {}) as JsonBody;
  if (typeof isAvailable !== 'boolean') {
    return res.status(400).json({
      status: 'error',
      message: 'isAvailable must be a boolean',
    });
  }
  return performUpdate(req.params.id, { isAvailable }, res, req);
}

/** DELETE /:id — 200 on success, 404 when absent, 403 when not the caller's. */
export async function deleteRentalByIdLegacy(req: Request, res: Response): Promise<Response> {
  try {
    const existing = await rentalService.getRentalById(req.params.id);
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Rental not found' });
    }
    if (!canModifyRental(req, existing)) {
      return res.status(403).json({ status: 'error', message: 'You do not have access to this rental' });
    }
    await rentalService.deleteRental(req.params.id);
    return res.status(200).json({ status: 'success', message: 'Deleted successfully' });
  } catch (error: any) {
    return errorResponse(res, error, 'Failed to delete rental');
  }
}

/**
 * Legacy relationship helpers.
 *
 * The unified `Rental` has no `parentRentalId` and no direct tenant relation —
 * tenants attach through `Lease.tenantId`. These exports exist only because the
 * legacy routers reference them. They MUST NOT be wired to the destructive
 * handlers: `DELETE /api/units/:id/tenant` used to point at `deleteUnit`, which
 * would delete the whole Rental once this surface is live again.
 */
export async function listByPropertyLegacy(req: Request, res: Response): Promise<Response> {
  // No parent relation exists in the schema, so this is the unfiltered list.
  // Kept as a successful response rather than a 410/404 to preserve the route.
  return listRentals(req, res);
}

export function occupancyNotSupported(_req: Request, res: Response): Response {
  return res.status(400).json({
    status: 'error',
    message: 'Occupancy analytics are not available on the unified Rental model; use /api/rentals/analytics/summary',
  });
}

export function tenantAssignmentNotSupported(_req: Request, res: Response): Response {
  return res.status(400).json({
    status: 'error',
    message: 'Tenant assignment is managed through /api/leases',
  });
}

export default {
  listRentals,
  createRentalFromLegacy,
  getRentalByIdLegacy,
  updateRentalFromLegacy,
  setAvailabilityFromLegacy,
  deleteRentalByIdLegacy,
  listByPropertyLegacy,
  occupancyNotSupported,
  tenantAssignmentNotSupported,
};
