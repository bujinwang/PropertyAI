import http from 'http';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { app } from '../app';
import { prisma } from '../config/database';
import { resetDatabase } from './testDb';

/**
 * Tenancy on `/api/applications` and `/api/maintenance`.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Both routers were `/`-through-`/:id` on `authMiddleware.protect` ALONE, and
 * both controllers used `prisma.x.findMany()` with no `where` plus
 * `data: req.body` on create/update. Consequences:
 *
 *   - `GET /api/applications` returned every rental application in the system,
 *     including `notes`, to any authenticated user. Any tenant could read who
 *     applied for which unit.
 *   - `GET /api/maintenance` returned every maintenance request.
 *   - `POST` mass-assigned `req.body`, so a caller could file an application as
 *     ANOTHER applicant (`applicantId`) or attach it to any rental.
 *   - `PUT`/`DELETE` had no ownership check at all.
 *
 * Application ownership is `applicantId` (the renter) or the rental's ownership
 * ids (the landlord deciding on it). Maintenance ownership is the rental's
 * ownership ids, or `requestedById` (the resident reporting the fault). Both
 * hang off `Rental`, so `utils/rentalAccess.ts` is extended, not duplicated.
 *
 * Also pinned here: `POST /api/maintenance/assign-vendor` is role-gated
 * (ADMIN / PROPERTY_MANAGER) but previously accepted ANY `workOrderId`, so a
 * manager could re-assign a work order belonging to a rental they do not
 * control — and it `deleteMany()`d the existing assignment first.
 */

let server: http.Server;

describe('Application / maintenance tenancy isolation', () => {
  let landlordA: { id: string; token: string };
  let landlordB: { id: string; token: string };
  let admin: { id: string; token: string };
  let applicantA: { id: string; token: string };
  let applicantB: { id: string; token: string };

  let rentalAId: string;
  let rentalBId: string;
  let applicationAId: string;
  let applicationBId: string;
  let maintenanceAId: string;
  let maintenanceBId: string;

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

    landlordA = await mkUser('app-landlord-a@example.com', UserRole.PROPERTY_MANAGER);
    landlordB = await mkUser('app-landlord-b@example.com', UserRole.PROPERTY_MANAGER);
    admin = await mkUser('app-admin@example.com', UserRole.ADMIN);
    applicantA = await mkUser('app-applicant-a@example.com', UserRole.TENANT);
    applicantB = await mkUser('app-applicant-b@example.com', UserRole.TENANT);

    const rentalA = await mkRental(landlordA.id, 'App Rental A', '1 App Way', 'app-rental-a');
    const rentalB = await mkRental(landlordB.id, 'App Rental B', '2 App Way', 'app-rental-b');
    rentalAId = rentalA.id;
    rentalBId = rentalB.id;

    const applicationA = await prisma.application.create({
      data: { rentalId: rentalAId, applicantId: applicantA.id, notes: 'A private note' },
    });
    const applicationB = await prisma.application.create({
      data: { rentalId: rentalBId, applicantId: applicantB.id, notes: 'B private note' },
    });
    applicationAId = applicationA.id;
    applicationBId = applicationB.id;

    const maintenanceA = await prisma.maintenanceRequest.create({
      data: {
        title: 'A broken heater',
        description: 'No heat in unit A',
        rentalId: rentalAId,
        requestedById: applicantA.id,
      },
    });
    const maintenanceB = await prisma.maintenanceRequest.create({
      data: {
        title: 'B broken heater',
        description: 'No heat in unit B',
        rentalId: rentalBId,
        requestedById: applicantB.id,
      },
    });
    maintenanceAId = maintenanceA.id;
    maintenanceBId = maintenanceB.id;
  });

  afterAll(async () => {
    await resetDatabase(prisma);
    await prisma.$disconnect();
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // --------------------------------------------------------- applications ---
  describe('GET /api/applications', () => {
    it('lists only applications the landlord can decide on', async () => {
      const res = await request(server)
        .get('/api/applications')
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(200);
      const ids = res.body.map((a: any) => a.id);
      expect(ids).toContain(applicationAId);
      expect(ids).not.toContain(applicationBId);
    });

    it('shows an applicant only their own applications', async () => {
      const res = await request(server)
        .get('/api/applications')
        .set('Authorization', `Bearer ${applicantA.token}`);

      expect(res.status).toBe(200);
      const ids = res.body.map((a: any) => a.id);
      expect(ids).toContain(applicationAId);
      expect(ids).not.toContain(applicationBId);
    });

    it('lets ADMIN list across tenants', async () => {
      const res = await request(server)
        .get('/api/applications')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      const ids = res.body.map((a: any) => a.id);
      expect(ids).toContain(applicationAId);
      expect(ids).toContain(applicationBId);
    });
  });

  describe('GET /api/applications/:id', () => {
    it('refuses a cross-tenant application read', async () => {
      const res = await request(server)
        .get(`/api/applications/${applicationBId}`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(403);
    });

    it('refuses another applicant reading a private application', async () => {
      const res = await request(server)
        .get(`/api/applications/${applicationBId}`)
        .set('Authorization', `Bearer ${applicantA.token}`);

      expect(res.status).toBe(403);
    });

    it('lets the landlord read an application on their own rental', async () => {
      const res = await request(server)
        .get(`/api/applications/${applicationAId}`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/applications', () => {
    it('does not let a caller file an application as somebody else', async () => {
      const res = await request(server)
        .post('/api/applications')
        .set('Authorization', `Bearer ${applicantA.token}`)
        .send({ rentalId: rentalBId, applicantId: applicantB.id });

      // The body names another applicant AND another landlord's rental; the
      // caller may not act as either.
      expect(res.status).toBe(403);
    });

    it('lets an applicant apply to an available rental as themselves', async () => {
      // Must be genuinely available — `mkRental` defaults to isAvailable:false
      // because those rentals exist to hold fixtures, not to be applied for.
      const available = await mkRental(
        landlordB.id,
        'Available Rental',
        '9 Open Way',
        'app-rental-available'
      );
      await prisma.rental.update({
        where: { id: available.id },
        data: { isAvailable: true },
      });

      const res = await request(server)
        .post('/api/applications')
        .set('Authorization', `Bearer ${applicantA.token}`)
        .send({ rentalId: available.id, applicantId: applicantA.id });

      expect(res.status).toBe(201);
      expect(res.body.applicantId).toBe(applicantA.id);
    });
  });

  describe('PUT /api/applications/:id', () => {
    it('refuses a cross-tenant status change', async () => {
      const res = await request(server)
        .put(`/api/applications/${applicationBId}`)
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(403);

      const unchanged = await prisma.application.findUnique({ where: { id: applicationBId } });
      expect(unchanged?.status).toBe('PENDING');
    });

    it('does not let an applicant re-point their application at another rental', async () => {
      // Deliberately a rental with NO existing application from this applicant,
      // so the @@unique([rentalId, applicantId]) constraint cannot mask the
      // authorization result — otherwise the row is rejected for the wrong
      // reason and the assertion proves nothing.
      const rentalC = await mkRental(landlordA.id, 'App Rental C', '3 App Way', 'app-rental-c');

      await request(server)
        .put(`/api/applications/${applicationAId}`)
        .set('Authorization', `Bearer ${applicantA.token}`)
        .send({ rentalId: rentalC.id, applicantId: applicantB.id });

      const after = await prisma.application.findUnique({ where: { id: applicationAId } });
      expect(after?.rentalId).toBe(rentalAId);
      expect(after?.applicantId).toBe(applicantA.id);
    });
  });

  describe('DELETE /api/applications/:id', () => {
    it('refuses a cross-tenant delete and the row survives', async () => {
      const res = await request(server)
        .delete(`/api/applications/${applicationBId}`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(403);

      const survivor = await prisma.application.findUnique({ where: { id: applicationBId } });
      expect(survivor).not.toBeNull();
    });
  });

  // ---------------------------------------------------------- maintenance ---
  describe('GET /api/maintenance', () => {
    it('lists only maintenance requests under the caller\'s own rentals', async () => {
      const res = await request(server)
        .get('/api/maintenance')
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((m: any) => m.id);
      expect(ids).toContain(maintenanceAId);
      expect(ids).not.toContain(maintenanceBId);
    });

    it('shows a tenant only the requests they raised', async () => {
      const res = await request(server)
        .get('/api/maintenance')
        .set('Authorization', `Bearer ${applicantA.token}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((m: any) => m.id);
      expect(ids).toContain(maintenanceAId);
      expect(ids).not.toContain(maintenanceBId);
    });

    it('lets ADMIN list across tenants', async () => {
      const res = await request(server)
        .get('/api/maintenance')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      const ids = res.body.data.map((m: any) => m.id);
      expect(ids).toContain(maintenanceAId);
      expect(ids).toContain(maintenanceBId);
    });
  });

  describe('GET /api/maintenance/:id', () => {
    it('refuses a cross-tenant maintenance read', async () => {
      const res = await request(server)
        .get(`/api/maintenance/${maintenanceBId}`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(403);
    });

    it('lets the landlord read their own maintenance request', async () => {
      const res = await request(server)
        .get(`/api/maintenance/${maintenanceAId}`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/maintenance', () => {
    it('does not let a tenant raise a request against another landlord\'s rental', async () => {
      const res = await request(server)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${applicantA.token}`)
        .send({
          title: 'Fabricated',
          description: 'against someone else',
          rentalId: rentalBId,
          requestedById: applicantA.id,
        });

      expect(res.status).toBe(403);
    });

    it('lets a tenant raise a request on the rental they lease', async () => {
      const lease = await prisma.lease.create({
        data: {
          rentalId: rentalAId,
          tenantId: applicantA.id,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          rentAmount: 2000,
          securityDeposit: 2000,
          status: 'ACTIVE',
        },
      });
      expect(lease.id).toBeTruthy();

      const res = await request(server)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${applicantA.token}`)
        .send({
          title: 'Leaking tap',
          description: 'Kitchen tap drips',
          rentalId: rentalAId,
          requestedById: applicantA.id,
        });

      expect(res.status).toBe(201);
    });

    it('does not let a caller raise a request in someone else\'s name', async () => {
      const res = await request(server)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${applicantA.token}`)
        .send({
          title: 'Spoofed requester',
          description: 'should be attributed to the caller',
          rentalId: rentalAId,
          requestedById: landlordB.id,
        });

      // Either refused, or recorded against the caller — never as landlordB.
      if (res.status === 201) {
        expect(res.body.data.requestedById).toBe(applicantA.id);
      } else {
        expect(res.status).toBe(403);
      }
    });
  });

  describe('PUT /api/maintenance/:id', () => {
    it('refuses a cross-tenant update and leaves the row unchanged', async () => {
      const res = await request(server)
        .put(`/api/maintenance/${maintenanceBId}`)
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({ title: 'Hijacked' });

      expect(res.status).toBe(403);

      const unchanged = await prisma.maintenanceRequest.findUnique({
        where: { id: maintenanceBId },
      });
      expect(unchanged?.title).toBe('B broken heater');
    });

    it('refuses a tenant editing the request they raised', async () => {
      const res = await request(server)
        .put(`/api/maintenance/${maintenanceAId}`)
        .set('Authorization', `Bearer ${applicantA.token}`)
        .send({ status: 'COMPLETED' });

      // A resident reporting a fault must not be able to close it themselves.
      expect(res.status).toBe(403);
    });

    it('does not let the landlord re-point a request at another rental', async () => {
      const res = await request(server)
        .put(`/api/maintenance/${maintenanceAId}`)
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({ rentalId: rentalBId, title: 'Renamed by owner' });

      expect(res.status).toBe(200);
      expect(res.body.rentalId).toBe(rentalAId);
      expect(res.body.title).toBe('Renamed by owner');
    });
  });

  describe('DELETE /api/maintenance/:id', () => {
    it('refuses a cross-tenant delete and the row survives', async () => {
      const res = await request(server)
        .delete(`/api/maintenance/${maintenanceBId}`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(403);

      const survivor = await prisma.maintenanceRequest.findUnique({
        where: { id: maintenanceBId },
      });
      expect(survivor).not.toBeNull();
    });
  });

  // ------------------------------------------------------ assign-vendor ---
  describe('POST /api/maintenance/assign-vendor', () => {
    it('refuses assigning a vendor to a work order on another landlord\'s rental', async () => {
      const requestB = await prisma.maintenanceRequest.findUnique({
        where: { id: maintenanceBId },
      });
      const workOrderB = await prisma.workOrder.create({
        data: {
          title: requestB!.title,
          description: requestB!.description,
          priority: 'MEDIUM',
          maintenanceRequestId: maintenanceBId,
        },
      });
      const vendor = await prisma.vendor.create({
        data: {
          name: 'Some Vendor',
          email: 'vendor-assign@example.com',
          phone: '555-0100',
          address: '1 Vendor Way',
          // Required with no default: specialty, availability, and the two
          // scalar-list columns (a bare `String[]` has no implicit default).
          specialty: 'PLUMBING',
          availability: 'BUSINESS_HOURS',
          certifications: [],
          serviceAreas: [],
          contactPersonId: landlordB.id,
        },
      });

      const res = await request(server)
        .post('/api/maintenance/assign-vendor')
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({ workOrderId: workOrderB.id, vendorId: vendor.id });

      expect(res.status).toBe(403);

      // Critically: the existing (empty) assignment set must be untouched.
      const assignments = await prisma.workOrderAssignment.findMany({
        where: { workOrderId: workOrderB.id },
      });
      expect(assignments).toHaveLength(0);
    });
  });

  /**
   * `/api/users` is ADMIN-only, so breadth is by design — the RESPONSE SHAPE was
   * not. The read endpoints returned the whole row, including `password` (the
   * bcrypt hash), `mfaSecret`, `refreshToken`, `passwordResetToken`,
   * `passwordHistory` and `biometricPublicKey`. Confirmed by probe: a GET as
   * ADMIN returned `password: "$2b$10$..."` and a populated `mfaSecret`.
   */
  describe('user administration response shape', () => {
    it('never returns password or MFA material from the list endpoint', async () => {
      const res = await request(server)
        .get('/api/users')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      const row = res.body[0];
      expect(row).toBeDefined();

      for (const secret of [
        'password',
        'mfaSecret',
        'refreshToken',
        'passwordResetToken',
        'passwordHistory',
        'biometricPublicKey',
      ]) {
        expect(row).not.toHaveProperty(secret);
      }
      // Asserted as text too, in case a nested object carries it.
      expect(JSON.stringify(res.body)).not.toContain('mfaSecret');
      expect(JSON.stringify(res.body)).not.toContain('refreshToken');
    });

    it('never returns the password hash from the by-id endpoint', async () => {
      const res = await request(server)
        .get(`/api/users/${landlordA.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('password');
      expect(res.body.id).toBe(landlordA.id);
    });

    it('does not let an operator set a password or forge MFA state', async () => {
      const res = await request(server)
        .put(`/api/users/${landlordA.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ firstName: 'Renamed', password: 'plaintext-ignored', mfaEnabled: true });

      expect(res.status).toBe(200);
      expect(res.body.firstName).toBe('Renamed');

      const after = await prisma.user.findUnique({ where: { id: landlordA.id } });
      // The password column must still hold a hash — not the plaintext we just
      // sent, which bcrypt.compare could never match anyway.
      expect(after?.password).not.toBe('plaintext-ignored');
      expect(after?.password).toBe('not-a-real-hash');
      expect(after?.mfaEnabled).toBe(false);
    });
  });
});
