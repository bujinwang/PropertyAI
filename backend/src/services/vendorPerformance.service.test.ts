// @ts-nocheck
/**
 * `VendorPerformanceService.recordVendorPerformance` — was broken by a phantom column.
 *
 * WHY THIS FILE WAS REWRITTEN
 * ---------------------------
 * The previous version of this suite mocked the entire Prisma client:
 *
 *     jest.mock('../config/database', () => ({
 *       prisma: { vendorPerformanceRating: { create: jest.fn() } },
 *     }));
 *     (prisma.vendorPerformanceRating.create as jest.Mock).mockResolvedValue(mockRating);
 *     expect(rating).toEqual(mockRating);
 *
 * That asserted that a mock returns the object it was told to return — it could
 * never fail, and it hid a real bug. The service was passing `metricId`, which
 * is NOT a column on `VendorPerformanceRating`:
 *
 *     data: { ..., metricId, ... } as any,
 *              // Cast to any to bypass type checking for metricId
 *
 * The `as any` silenced `tsc`, and the mock silenced the runtime. So every real
 * call threw `PrismaClientValidationError: Unknown argument 'metricId'` while
 * the suite stayed green. The fixture even invented the wrong field names
 * (`score`, `comments`) instead of the real `rating`, `comment`.
 *
 * The mock was also the reason the bug survived: a mocked `create` accepts any
 * argument shape, so only a real client validates the payload against the schema.
 *
 * WHAT IS ASSERTED NOW
 *  1. A rating is actually persisted, with the real column names.
 *  2. `metricId` is accepted by the signature but NOT written (no such column).
 *  3. The returned row is the persisted row, not a mock.
 *
 * Uses the real client and `resetDatabase`, per the repo convention. `metricId`
 * is documented as a deliberate gap in the service: if per-metric ratings are
 * genuinely needed, that is a schema change, not something to fake.
 */
import { prisma } from '../config/database';
import { vendorPerformanceService } from './vendorPerformance.service';
import { resetDatabase } from '../__tests__/testDb';

let vendorId: string;
let workOrderId: string;
let ratedById: string;

beforeAll(async () => {
  await resetDatabase(prisma);

  const owner = await prisma.user.create({
    data: {
      email: 'vendor-perf-owner@example.com',
      password: 'hashed-not-used',
      firstName: 'Vendor',
      lastName: 'Owner',
      role: 'PROPERTY_MANAGER',
    },
  });
  ratedById = owner.id;

  const vendorUser = await prisma.user.create({
    data: {
      email: 'vendor-perf-vendor@example.com',
      password: 'hashed-not-used',
      firstName: 'V',
      lastName: 'Endor',
      // `VENDOR`, not `CONTRACTOR` -- UserRole is
      // { ADMIN, PROPERTY_MANAGER, TENANT, USER, VENDOR, OWNER }.
      role: 'VENDOR',
    },
  });

  // `Vendor` has six required scalars besides the optional contactPersonId.
  const vendor = await prisma.vendor.create({
    data: {
      name: 'Acme Plumbing',
      phone: '555-0100',
      email: 'vendor-perf-acme@example.com',
      address: '1 Main St',
      specialty: 'Plumbing',
      availability: 'Weekdays',
      contactPersonId: vendorUser.id,
    },
  });
  vendorId = vendor.id;

  // WorkOrder requires a MaintenanceRequest, which requires a Rental + requester.
  // Rental has many required scalars (address/city/state/zipCode/rent/slug) and
  // three required actor ids.
  const rental = await prisma.rental.create({
    data: {
      title: 'Vendor Perf Test Property',
      address: '10 Test Ave',
      city: 'Edmonton',
      state: 'AB',
      zipCode: 'T5K0A1',
      rent: 1500,
      slug: 'vendor-perf-test-property',
      // `propertyType` is required (no default) -- PropertyType enum.
      propertyType: 'APARTMENT',
      managerId: owner.id,
      ownerId: owner.id,
      createdById: owner.id,
    },
  });

  const request = await prisma.maintenanceRequest.create({
    data: {
      rentalId: rental.id,
      requestedById: owner.id,
      title: 'Leaky tap',
      description: 'The kitchen tap drips.',
      status: 'OPEN',
      priority: 'MEDIUM',
    },
  });

  // `WorkOrder.maintenanceRequestId` is @unique, so exactly one per request.
  // NOTE: `WorkOrder` has NO `vendorId` column -- the vendor link lives on
  // `WorkOrderAssignment`. Passing `vendorId` here throws
  // "Unknown argument `vendorId`". The rating's `vendorId` is supplied
  // independently by the caller, so no assignment row is needed for this test.
  const workOrder = await prisma.workOrder.create({
    data: {
      maintenanceRequestId: request.id,
      status: 'COMPLETED',
      title: 'Fix tap',
      description: 'Replace the cartridge.',
      // `WorkOrder.priority` is required (no default) -- Priority enum.
      priority: 'MEDIUM',
    },
  });
  workOrderId = workOrder.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('VendorPerformanceService', () => {
  it('persists a vendor performance rating with the real column names', async () => {
    const rating = await vendorPerformanceService.recordVendorPerformance(
      vendorId,
      workOrderId,
      'metric-1', // accepted, deliberately NOT written -- no such column
      5,
      'Great job!',
      ratedById
    );

    expect(rating.id).toBeTruthy();
    expect(rating.vendorId).toBe(vendorId);
    expect(rating.workOrderId).toBe(workOrderId);
    expect(rating.rating).toBe(5);
    expect(rating.comment).toBe('Great job!');
    expect(rating.ratedById).toBe(ratedById);

    // Confirm it is really in the database, not just an in-memory return.
    const persisted = await prisma.vendorPerformanceRating.findUnique({
      where: { id: rating.id },
    });
    expect(persisted).not.toBeNull();
    expect(persisted!.rating).toBe(5);
    expect(persisted!.comment).toBe('Great job!');

    // The schema has NO metricId. Asserting the row object does not expose one
    // pins the documented gap: the value is accepted but cannot be stored.
    expect(Object.keys(persisted!)).not.toContain('metricId');
  });

  it('rejects a second rating for the same vendor+workOrder (unique constraint)', async () => {
    // `@@unique([vendorId, workOrderId])` -- this is the real constraint, and a
    // call that ignored it would silently overwrite history.
    await expect(
      vendorPerformanceService.recordVendorPerformance(
        vendorId,
        workOrderId,
        'metric-2',
        3,
        'Second rating',
        ratedById
      )
    ).rejects.toThrow();

    const count = await prisma.vendorPerformanceRating.count({
      where: { vendorId, workOrderId },
    });
    expect(count).toBe(1);
  });
});
