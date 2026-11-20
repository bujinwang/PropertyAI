// @ts-nocheck
/**
 * `VendorPaymentService.handleStripeWebhook` — a successful payout could never be marked PAID.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The `payout.paid` branch wrote a column that does not exist:
 *
 *     data: { status: 'PAID', processedAt: new Date(...) } as any,
 *                            ^^^^^^^^^^^ VendorPayment has `paymentDate`, not this
 *
 * The `as any` silenced `tsc`; nothing else looked. Against the real schema:
 *
 *     Unknown argument `processedAt`. Available options are marked with ?.
 *
 * `VendorPayment` has `paymentDate DateTime @default(now())` and no other
 * timestamp that could mean "when this was paid". So EVERY `payout.paid`
 * webhook threw before touching a row. The route is live --
 * `POST /api/vendor-payments/stripe-webhooks` is mounted
 * (`routes/vendorPayment.routes.ts:21`, `routes/index.ts:116`) -- meaning a
 * genuine Stripe payout could never move a vendor payment to PAID.
 *
 * Note the `payout.failed` branch was always correct ({ status: 'FAILED' }, no
 * timestamp). That asymmetry is why the bug survived review: the sibling branch
 * looked right, and only the paid path carried the phantom column.
 *
 * WHAT IS ASSERTED
 *  1. `payout.paid` sets status PAID AND `paymentDate` from Stripe's
 *     `arrival_date` -- the assertion that was red before the fix.
 *  2. `payout.failed` sets status FAILED.
 *  3. A paid event with no `metadata.vendorPaymentId` touches nothing (no
 *     "update where id undefined", which would throw or match nothing).
 *  4. `processedAt` is never written -- pinned by asserting the persisted row
 *     has no such property and that the real timestamp column carries the
 *     Stripe arrival date.
 *
 * WHY THE STRIPE CLIENT IS STUBBED BUT PRISMA IS REAL
 * --------------------------------------------------
 * `handleStripeWebhook` receives an already-constructed `Stripe.Event`, so no
 * network call happens -- but the module still runs
 * `new Stripe(process.env.STRIPE_SECRET_KEY!)` at import time. A fake key is
 * set for that, and the constructor is mocked so no real SDK work occurs.
 * The database side is REAL: the whole point is that a mocked Prisma accepts
 * any payload, which is exactly how this bug hid. `config/passport.ts` and this
 * service both create a module-scope PrismaClient; the delegate is swapped onto
 * the shared client so there is one connection and no hung Jest process.
 */
import { prisma } from '../config/database';
import { resetDatabase } from '../__tests__/testDb';

// Must be set BEFORE the service module is required (module-scope `new Stripe`).
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: { constructEvent: jest.fn() },
    paymentIntents: { create: jest.fn() },
  }));
});

jest.mock('../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

let vendorPaymentService: any;
let vendorId: string;
let workOrderId: string;
let paymentId: string;

const paidEvent = (vendorPaymentId?: string): any => ({
  id: 'evt_paid',
  type: 'payout.paid',
  data: {
    object: {
      id: 'po_1',
      object: 'payout',
      // Stripe gives seconds since epoch.
      arrival_date: 1735689600, // 2025-01-01T00:00:00Z
      metadata: vendorPaymentId ? { vendorPaymentId } : {},
    },
  },
});

const failedEvent = (vendorPaymentId?: string): any => ({
  id: 'evt_failed',
  type: 'payout.failed',
  data: {
    object: {
      id: 'po_2',
      object: 'payout',
      metadata: vendorPaymentId ? { vendorPaymentId } : {},
    },
  },
});

beforeAll(async () => {
  await resetDatabase(prisma);

  const mod = require('./vendorPayment.service');
  vendorPaymentService = mod.vendorPaymentService || mod.default;

  const owner = await prisma.user.create({
    data: {
      email: 'vendor-pay-owner@example.com',
      password: 'hashed-not-used',
      firstName: 'Vendor',
      lastName: 'Payer',
      role: 'PROPERTY_MANAGER',
    },
  });

  const vendorUser = await prisma.user.create({
    data: {
      email: 'vendor-pay-vendor@example.com',
      password: 'hashed-not-used',
      firstName: 'V',
      lastName: 'Endor',
      role: 'VENDOR',
    },
  });

  const vendor = await prisma.vendor.create({
    data: {
      name: 'Acme Electrical',
      phone: '555-0200',
      email: 'vendor-pay-acme@example.com',
      address: '2 Main St',
      specialty: 'Electrical',
      availability: 'Weekdays',
      contactPersonId: vendorUser.id,
    },
  });
  vendorId = vendor.id;

  const rental = await prisma.rental.create({
    data: {
      title: 'Vendor Pay Test Property',
      address: '20 Test Ave',
      city: 'Edmonton',
      state: 'AB',
      zipCode: 'T5K0A2',
      rent: 1800,
      slug: 'vendor-pay-test-property',
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
      title: 'Dead outlet',
      description: 'Outlet in the hallway is dead.',
      status: 'OPEN',
      priority: 'MEDIUM',
    },
  });

  const workOrder = await prisma.workOrder.create({
    data: {
      maintenanceRequestId: request.id,
      status: 'COMPLETED',
      title: 'Fix outlet',
      description: 'Replace the outlet.',
      priority: 'MEDIUM',
    },
  });
  workOrderId = workOrder.id;

  const payment = await prisma.vendorPayment.create({
    data: { amount: 250, status: 'APPROVED', workOrderId, vendorId },
  });
  paymentId = payment.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('VendorPaymentService.handleStripeWebhook', () => {
  it('marks a payment PAID and sets paymentDate from the payout arrival date', async () => {
    await vendorPaymentService.handleStripeWebhook(paidEvent(paymentId));

    const row = await prisma.vendorPayment.findUnique({ where: { id: paymentId } });

    expect(row).not.toBeNull();
    expect(row!.status).toBe('PAID');

    // The pre-fix failure was here: writing `processedAt` threw a
    // PrismaClientValidationError, so this row stayed APPROVED.
    expect(row!.paymentDate.toISOString()).toBe('2025-01-01T00:00:00.000Z');

    // `processedAt` is not a column. If someone reintroduces it behind an
    // `as any`, the write throws and the row above never reaches PAID.
    expect(Object.keys(row!)).not.toContain('processedAt');
  });

  it('marks a payment FAILED on payout.failed', async () => {
    // The failed branch never had the phantom column; assert it still works so
    // a future refactor of the shared shape cannot break it silently.
    const p2 = await prisma.vendorPayment.create({
      data: { amount: 99, status: 'APPROVED', workOrderId, vendorId },
    });

    await vendorPaymentService.handleStripeWebhook(failedEvent(p2.id));

    const row = await prisma.vendorPayment.findUnique({ where: { id: p2.id } });
    expect(row!.status).toBe('FAILED');
  });

  it('updates nothing when the payout carries no vendorPaymentId', async () => {
    const before = await prisma.vendorPayment.findMany({ orderBy: { id: 'asc' } });
    const snapshot = before.map((r) => `${r.id}:${r.status}`);

    // No metadata id -> the guard must skip the update entirely. Without it the
    // code would call update({ where: { id: undefined } }) which Prisma rejects.
    await expect(
      vendorPaymentService.handleStripeWebhook(paidEvent(undefined))
    ).resolves.not.toThrow();

    const after = await prisma.vendorPayment.findMany({ orderBy: { id: 'asc' } });
    expect(after.map((r) => `${r.id}:${r.status}`)).toEqual(snapshot);
  });
});
