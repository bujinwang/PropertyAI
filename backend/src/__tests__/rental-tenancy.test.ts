import http from 'http';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { app } from '../app';
import { prisma } from '../config/database';
import { resetDatabase } from './testDb';

/**
 * Tenancy / ownership on the LIVE `/api/rentals` surface.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `rentalRoutes.ts` guarded every route with `authMiddleware.protect` ONLY —
 * there is no `checkRole` anywhere in that router. `protect` proves *who* you
 * are and nothing else. Combined with `rentalController` treating `req.body`
 * as the whole `CreateRentalDto`, that produced three separate holes:
 *
 *   1. CREATE trusted caller-supplied `managerId` / `ownerId` / `createdById`
 *      (they were even in the `requiredFields` list), so any authenticated
 *      user could create a rental attributed to somebody else.
 *   2. READ/UPDATE/DELETE never checked ownership: any authenticated user
 *      could list every rental in the database, read any rental by id, rewrite
 *      it (including moving its ownership), or delete it.
 *   3. There was no role gate at all, so a TENANT could delete a landlord's
 *      entire portfolio.
 *
 * The restored legacy surface (`/api/properties`, `/api/units`) already
 * hardened create against (1). This file pins the same property — plus (2) and
 * (3) — on `/api/rentals`, and is deliberately written so that it FAILS
 * against the old behaviour rather than describing it.
 *
 * Contract asserted here:
 *   - ownership ids are server-set from the authenticated user, never the body;
 *   - a landlord sees and mutates only rentals they manage or own;
 *   - a cross-tenant read/update/delete is refused (403) and does not mutate;
 *   - ADMIN sees everything;
 *   - TENANT / VENDOR cannot write at all.
 */

let server: http.Server;

describe('Rental tenancy isolation', () => {
  let landlordA: { id: string; token: string };
  let landlordB: { id: string; token: string };
  let admin: { id: string; token: string };
  let tenantUser: { id: string; token: string };
  let rentalAId: string;

  const signToken = (id: string, role: UserRole): string =>
    jwt.sign({ id, role }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

  const newRentalBody = {
    title: 'A-Owned Rental',
    address: '1 Isolation Way',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    propertyType: 'HOUSE',
    rent: 2000,
  };

  beforeAll(async () => {
    server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    await resetDatabase(prisma);

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

    landlordA = await mkUser('landlord-a@example.com', UserRole.PROPERTY_MANAGER);
    landlordB = await mkUser('landlord-b@example.com', UserRole.PROPERTY_MANAGER);
    admin = await mkUser('rental-admin@example.com', UserRole.ADMIN);
    tenantUser = await mkUser('rental-tenant@example.com', UserRole.TENANT);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('create', () => {
    it('ignores caller-supplied ownership ids and uses the authenticated user', async () => {
      const response = await request(server)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({
          ...newRentalBody,
          // A real, valid other user — not a garbage id, which would only prove
          // the foreign key rejects it.
          managerId: landlordB.id,
          ownerId: landlordB.id,
          createdById: landlordB.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.managerId).toBe(landlordA.id);
      expect(response.body.data.ownerId).toBe(landlordA.id);
      expect(response.body.data.createdById).toBe(landlordA.id);
      expect(response.body.data.managerId).not.toBe(landlordB.id);
      expect(response.body.data.ownerId).not.toBe(landlordB.id);
      expect(response.body.data.createdById).not.toBe(landlordB.id);

      rentalAId = response.body.data.id;
    });

    it('does not require the caller to supply ownership ids', async () => {
      const response = await request(server)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({
          ...newRentalBody,
          title: 'A-Owned Rental Without Ids',
          address: '2 Isolation Way',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.managerId).toBe(landlordA.id);
    });

    it('forbids a TENANT from creating a rental', async () => {
      const response = await request(server)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${tenantUser.token}`)
        .send({ ...newRentalBody, title: 'Tenant Created', address: '3 Nowhere' });

      expect(response.status).toBe(403);
    });
  });

  describe('read', () => {
    it('lists only the caller\'s own rentals', async () => {
      const response = await request(server)
        .get('/api/rentals')
        .set('Authorization', `Bearer ${landlordB.token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      const ids = response.body.data.map((r: any) => r.id);
      expect(ids).not.toContain(rentalAId);
    });

    it('lists the caller\'s own rentals when they do own some', async () => {
      const response = await request(server)
        .get('/api/rentals')
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(response.status).toBe(200);
      const ids = response.body.data.map((r: any) => r.id);
      expect(ids).toContain(rentalAId);
    });

    it('lets ADMIN list across tenants', async () => {
      const response = await request(server)
        .get('/api/rentals')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      const ids = response.body.data.map((r: any) => r.id);
      expect(ids).toContain(rentalAId);
    });

    it('refuses to read another tenant\'s rental by id', async () => {
      const response = await request(server)
        .get(`/api/rentals/${rentalAId}`)
        .set('Authorization', `Bearer ${landlordB.token}`);

      expect(response.status).toBe(403);
      expect(response.body.data).toBeUndefined();
    });

    it('allows the owner to read their own rental by id', async () => {
      const response = await request(server)
        .get(`/api/rentals/${rentalAId}`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(rentalAId);
    });
  });

  describe('update', () => {
    it('refuses a cross-tenant update and does not mutate the row', async () => {
      const response = await request(server)
        .put(`/api/rentals/${rentalAId}`)
        .set('Authorization', `Bearer ${landlordB.token}`)
        .send({ title: 'HIJACKED BY B' });

      expect(response.status).toBe(403);

      const check = await prisma.rental.findUnique({ where: { id: rentalAId } });
      expect(check?.title).toBe('A-Owned Rental');
    });

    it('does not let the owner move ownership via PUT', async () => {
      const response = await request(server)
        .put(`/api/rentals/${rentalAId}`)
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({
          title: 'A-Owned Rental',
          managerId: landlordB.id,
          ownerId: landlordB.id,
          createdById: landlordB.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.managerId).toBe(landlordA.id);
      expect(response.body.data.ownerId).toBe(landlordA.id);
      expect(response.body.data.createdById).toBe(landlordA.id);
    });
  });

  describe('delete', () => {
    it('refuses a cross-tenant delete and leaves the row intact', async () => {
      const response = await request(server)
        .delete(`/api/rentals/${rentalAId}`)
        .set('Authorization', `Bearer ${landlordB.token}`);

      expect(response.status).toBe(403);

      const check = await prisma.rental.findUnique({ where: { id: rentalAId } });
      expect(check).not.toBeNull();
    });

    it('forbids a TENANT from deleting a rental', async () => {
      const response = await request(server)
        .delete(`/api/rentals/${rentalAId}`)
        .set('Authorization', `Bearer ${tenantUser.token}`);

      expect(response.status).toBe(403);
    });
  });

  /**
   * Residents must be able to see their OWN home. A blanket
   * "only operator roles can read" rule would 403 a tenant opening the property
   * they rent, so reads follow the Lease/Application link while writes stay
   * operator-only. These cases pin that distinction.
   */
  describe('resident access via lease', () => {
    let leasedRentalId: string;

    beforeAll(async () => {
      const created = await request(server)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({
          ...newRentalBody,
          title: 'Tenant Home',
          address: '4 Leased Lane',
          // A tenant can only see a rental that is actually available to lease
          // through this route; the lease row is what grants access.
        });

      expect(created.status).toBe(201);
      leasedRentalId = created.body.data.id;

      await prisma.lease.create({
        data: {
          rentalId: leasedRentalId,
          tenantId: tenantUser.id,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          rentAmount: 2000,
          securityDeposit: 2000,
          status: 'ACTIVE',
        },
      });
    });

    it('lets a TENANT read the rental they lease', async () => {
      const response = await request(server)
        .get(`/api/rentals/${leasedRentalId}`)
        .set('Authorization', `Bearer ${tenantUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(leasedRentalId);
    });

    it('still refuses a TENANT reading a rental they do not lease', async () => {
      const response = await request(server)
        .get(`/api/rentals/${rentalAId}`)
        .set('Authorization', `Bearer ${tenantUser.token}`);

      expect(response.status).toBe(403);
    });

    it('does not let a TENANT edit the rental they merely lease', async () => {
      const response = await request(server)
        .put(`/api/rentals/${leasedRentalId}`)
        .set('Authorization', `Bearer ${tenantUser.token}`)
        .send({ rent: 1 });

      expect(response.status).toBe(403);

      const check = await prisma.rental.findUnique({ where: { id: leasedRentalId } });
      expect(check?.rent).toBe(2000);
    });
  });
});
