import http from 'http';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { app } from '../app';
import { prisma } from '../config/database';
import { resetDatabase } from './testDb';

/**
 * Tenancy on `/api/leases` and `/api/transactions`.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Both routers were guarded by `authMiddleware.protect` ONLY — no `checkRole`,
 * no row check — and both controllers treated `req.body` as the entire Prisma
 * payload. Combined with unfiltered `findMany()`, that produced:
 *
 *   1. `GET /api/transactions` returned EVERY financial record in the system to
 *      any authenticated user, including tenants of unrelated landlords.
 *   2. `GET /api/leases` returned every lease (rent, deposit, tenant id).
 *   3. `create`/`update` mass-assigned `req.body`, so a caller could set
 *      `tenantId`, `rentalId`, `approvedById`, or any amount on someone else's
 *      record — and `PUT` could rewrite a lease's tenancy.
 *   4. `DELETE` had no ownership check at all.
 *
 * Ownership on both aggregates is ONE hop from `Rental`, which already has a
 * central policy (`utils/rentalAccess.ts`): a lease belongs to the rental it is
 * attached to; a transaction belongs to the lease it is attached to. There is no
 * separate rule to invent — the policy is reused, not duplicated.
 *
 * Contract asserted here:
 *   - a landlord sees only leases/transactions under their own rentals;
 *   - cross-tenant read/update/delete is refused (403) and does not mutate;
 *   - a tenant may read their OWN lease and its transactions (they must be able
 *     to see what they are being charged) but may never mutate;
 *   - ownership/tenancy fields cannot be moved through the body;
 *   - ADMIN sees everything.
 */

let server: http.Server;

describe('Lease / transaction tenancy isolation', () => {
  let landlordA: { id: string; token: string };
  let landlordB: { id: string; token: string };
  let admin: { id: string; token: string };
  let tenantA: { id: string; token: string };

  let rentalAId: string;
  let rentalBId: string;
  let leaseAId: string;
  let leaseBId: string;
  let transactionAId: string;
  let transactionBId: string;

  const signToken = (id: string, role: UserRole): string =>
    jwt.sign({ id, role }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

  const mkUser = async (email: string, role: UserRole) => {
    const user = await prisma.user.create({
      data: {
        email,
        password: 'not-a-real-hash',
        firstName: role,
        lastName: 'Fixture',
        role,
      },
    });
    return { id: user.id, token: signToken(user.id, role) };
  };

  const mkRental = async (ownerId: string, title: string, address: string, slug: string) =>
    prisma.rental.create({
      data: {
        title,
        address,
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA',
        propertyType: 'HOUSE',
        slug,
        rent: 2000,
        deposit: 2000,
        managerId: ownerId,
        ownerId,
        createdById: ownerId,
        status: 'ACTIVE',
        isAvailable: false,
      },
    });

  beforeAll(async () => {
    server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    await resetDatabase(prisma);

    landlordA = await mkUser('lease-landlord-a@example.com', UserRole.PROPERTY_MANAGER);
    landlordB = await mkUser('lease-landlord-b@example.com', UserRole.PROPERTY_MANAGER);
    admin = await mkUser('lease-admin@example.com', UserRole.ADMIN);
    tenantA = await mkUser('lease-tenant-a@example.com', UserRole.TENANT);

    const rentalA = await mkRental(landlordA.id, 'Lease Rental A', '1 Lease Way', 'lease-rental-a');
    const rentalB = await mkRental(landlordB.id, 'Lease Rental B', '2 Lease Way', 'lease-rental-b');
    rentalAId = rentalA.id;
    rentalBId = rentalB.id;

    // `Lease.rentalId` is @unique, so one lease per rental.
    const leaseA = await prisma.lease.create({
      data: {
        rentalId: rentalAId,
        tenantId: tenantA.id,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        rentAmount: 2000,
        securityDeposit: 2000,
        status: 'ACTIVE',
      },
    });
    const leaseB = await prisma.lease.create({
      data: {
        rentalId: rentalBId,
        tenantId: landlordB.id,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        rentAmount: 3000,
        securityDeposit: 3000,
        status: 'ACTIVE',
      },
    });
    leaseAId = leaseA.id;
    leaseBId = leaseB.id;

    const txA = await prisma.transaction.create({
      data: { amount: 2000, type: 'RENT_PAYMENT', leaseId: leaseAId, description: 'A rent' },
    });
    const txB = await prisma.transaction.create({
      data: { amount: 3000, type: 'RENT_PAYMENT', leaseId: leaseBId, description: 'B rent' },
    });
    transactionAId = txA.id;
    transactionBId = txB.id;
  });

  afterAll(async () => {
    await resetDatabase(prisma);
    await prisma.$disconnect();
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // ---------------------------------------------------------------- leases ---
  describe('GET /api/leases', () => {
    it('lists only leases under the caller\'s own rentals', async () => {
      const res = await request(server)
        .get('/api/leases')
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(200);
      const ids = res.body.map((l: any) => l.id);
      expect(ids).toContain(leaseAId);
      expect(ids).not.toContain(leaseBId);
    });

    it('does not leak another landlord\'s lease to a tenant', async () => {
      const res = await request(server)
        .get('/api/leases')
        .set('Authorization', `Bearer ${tenantA.token}`);

      expect(res.status).toBe(200);
      const ids = res.body.map((l: any) => l.id);
      expect(ids).toContain(leaseAId); // their own home
      expect(ids).not.toContain(leaseBId);
    });

    it('lets ADMIN list across tenants', async () => {
      const res = await request(server)
        .get('/api/leases')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      const ids = res.body.map((l: any) => l.id);
      expect(ids).toContain(leaseAId);
      expect(ids).toContain(leaseBId);
    });
  });

  describe('GET /api/leases/:id', () => {
    it('refuses a cross-tenant lease read', async () => {
      const res = await request(server)
        .get(`/api/leases/${leaseBId}`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(403);
    });

    it('lets the landlord read their own lease', async () => {
      const res = await request(server)
        .get(`/api/leases/${leaseAId}`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(leaseAId);
    });

    it('lets the tenant read the lease they are on', async () => {
      const res = await request(server)
        .get(`/api/leases/${leaseAId}`)
        .set('Authorization', `Bearer ${tenantA.token}`);

      expect(res.status).toBe(200);
    });

    it('404s an unknown lease id', async () => {
      const res = await request(server)
        .get('/api/leases/does-not-exist')
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/leases/:id', () => {
    it('refuses a cross-tenant lease update and leaves the row unchanged', async () => {
      const res = await request(server)
        .put(`/api/leases/${leaseBId}`)
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({ rentAmount: 1 });

      expect(res.status).toBe(403);

      const unchanged = await prisma.lease.findUnique({ where: { id: leaseBId } });
      expect(unchanged?.rentAmount).toBe(3000);
    });

    it('refuses a tenant editing their own lease', async () => {
      const res = await request(server)
        .put(`/api/leases/${leaseAId}`)
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({ rentAmount: 1 });

      expect(res.status).toBe(403);

      const unchanged = await prisma.lease.findUnique({ where: { id: leaseAId } });
      expect(unchanged?.rentAmount).toBe(2000);
    });

    it('does not let the landlord move the lease to another tenant or rental', async () => {
      const res = await request(server)
        .put(`/api/leases/${leaseAId}`)
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({ tenantId: landlordB.id, rentalId: rentalBId, rentAmount: 2100 });

      expect(res.status).toBe(200);
      expect(res.body.tenantId).toBe(tenantA.id);
      expect(res.body.rentalId).toBe(rentalAId);
      expect(res.body.rentAmount).toBe(2100); // legitimate field still applies
    });
  });

  describe('DELETE /api/leases/:id', () => {
    it('refuses a cross-tenant delete and the row survives', async () => {
      const res = await request(server)
        .delete(`/api/leases/${leaseBId}`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(403);

      const survivor = await prisma.lease.findUnique({ where: { id: leaseBId } });
      expect(survivor).not.toBeNull();
    });
  });

  // ---------------------------------------------------------- transactions ---
  describe('GET /api/transactions', () => {
    it('lists only transactions under the caller\'s own leases', async () => {
      const res = await request(server)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(200);
      const ids = res.body.map((t: any) => t.id);
      expect(ids).toContain(transactionAId);
      expect(ids).not.toContain(transactionBId);
    });

    it('lets the tenant see charges on their own lease only', async () => {
      const res = await request(server)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${tenantA.token}`);

      expect(res.status).toBe(200);
      const ids = res.body.map((t: any) => t.id);
      expect(ids).toContain(transactionAId);
      expect(ids).not.toContain(transactionBId);
    });

    it('lets ADMIN list across tenants', async () => {
      const res = await request(server)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      const ids = res.body.map((t: any) => t.id);
      expect(ids).toContain(transactionAId);
      expect(ids).toContain(transactionBId);
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('refuses a cross-tenant transaction read', async () => {
      const res = await request(server)
        .get(`/api/transactions/${transactionBId}`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(403);
    });

    it('lets the landlord read their own transaction', async () => {
      const res = await request(server)
        .get(`/api/transactions/${transactionAId}`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/transactions', () => {
    it('refuses a tenant recording a transaction', async () => {
      const res = await request(server)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({ amount: 1, type: 'RENT_PAYMENT', leaseId: leaseAId });

      expect(res.status).toBe(403);
    });

    it('refuses recording a transaction against another landlord\'s lease', async () => {
      const res = await request(server)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({ amount: 500, type: 'RENT_PAYMENT', leaseId: leaseBId });

      expect(res.status).toBe(403);
    });

    it('records a transaction on the caller\'s own lease', async () => {
      const res = await request(server)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({ amount: 500, type: 'MAINTENANCE_FEE', leaseId: leaseAId });

      expect(res.status).toBe(201);
      expect(res.body.leaseId).toBe(leaseAId);
    });
  });

  describe('PUT /api/transactions/:id', () => {
    it('refuses a cross-tenant update and leaves the row unchanged', async () => {
      const res = await request(server)
        .put(`/api/transactions/${transactionBId}`)
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({ amount: 1 });

      expect(res.status).toBe(403);

      const unchanged = await prisma.transaction.findUnique({ where: { id: transactionBId } });
      expect(unchanged?.amount).toBe(3000);
    });

    it('does not let the landlord re-point a transaction at another lease', async () => {
      const res = await request(server)
        .put(`/api/transactions/${transactionAId}`)
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({ leaseId: leaseBId, amount: 2100 });

      expect(res.status).toBe(200);
      expect(res.body.leaseId).toBe(leaseAId);
      expect(res.body.amount).toBe(2100);
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    it('refuses a cross-tenant delete and the row survives', async () => {
      const res = await request(server)
        .delete(`/api/transactions/${transactionBId}`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(403);

      const survivor = await prisma.transaction.findUnique({ where: { id: transactionBId } });
      expect(survivor).not.toBeNull();
    });
  });

  /**
   * `/api/users/validate/:id` and `/api/users/basic/:id` gated themselves on
   * `x-internal-service-call: true` — a header the CALLER asserts about itself,
   * which is not a security control. `/users/*` sits behind the global
   * `requireAuth`, so the caller needed a valid JWT, but any TENANT could then
   * read any user's email and role by id. Confirmed by probe before fixing.
   */
  describe('internal user endpoints', () => {
    it('refuses a TENANT spoofing the internal-service header', async () => {
      const res = await request(server)
        .get(`/api/users/basic/${landlordA.id}`)
        .set('Authorization', `Bearer ${tenantA.token}`)
        .set('x-internal-service-call', 'true');

      expect(res.status).toBe(403);
      expect(JSON.stringify(res.body)).not.toContain(landlordA.id);
    });

    it('refuses a TENANT on the validate endpoint too', async () => {
      const res = await request(server)
        .get(`/api/users/validate/${landlordA.id}`)
        .set('Authorization', `Bearer ${tenantA.token}`)
        .set('x-internal-service-call', 'true');

      expect(res.status).toBe(403);
    });

    it('still lets ADMIN read a user', async () => {
      const res = await request(server)
        .get(`/api/users/basic/${landlordA.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(landlordA.id);
    });
  });
});
