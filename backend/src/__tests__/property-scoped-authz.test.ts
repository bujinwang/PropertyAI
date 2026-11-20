import http from 'http';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { app } from '../app';
import { prisma } from '../config/database';
import { resetDatabase } from './testDb';

/**
 * `/api/escalation-policies`, `/api/on-call`, `/api/white-label`,
 * `/api/languages`, `/api/vendor-performance`, `/api/tenant-issue-prediction`
 * — tenancy on the remaining propertyId-scoped surfaces.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Found by the same detector as the previous two passes: every controller below
 * reads `req.user` ZERO times. All six routers are mounted in app.ts AFTER
 * `app.use('/api', requireAuth)`, so each one answers 401 to an anonymous probe
 * and *looks* protected. That is the trap — the global mount authenticates, it
 * never authorizes, and an anonymous request can never reveal the difference.
 *
 * WHAT IS ACTUALLY WRONG, PER SURFACE
 * -----------------------------------
 * escalationPolicy  `/properties/:propertyId/escalation-policies` is scoped by
 *                   URL ONLY. Any authenticated user dumps any landlord's
 *                   escalation policy (which includes the contact assigned to
 *                   each escalation step). POST/PUT/DELETE take `rentalId` /
 *                   `policyId` from the BODY and never check them.
 *
 * onCall            Same shape: `rentalId` from the URL for reads, `rentalId`
 *                   from the body for creates, plus rotations whose
 *                   `scheduleId` is unvalidated — a rotation can be hung onto
 *                   another landlord's schedule.
 *
 * whiteLabel        `getWhiteLabelConfigByPropertyId` is the worst of the set:
 *                   the config row carries `token` and `userId`, so an
 *                   unauthenticated-of-ownership read is a credential/settings
 *                   disclosure. Writes mass-assign `req.body`, `userId`
 *                   included.
 *
 * languages         A GLOBAL reference table (like marketing campaigns). Reads
 *                   should stay open to any authenticated caller; writes are
 *                   platform configuration and must be operator-only. This one
 *                   is fixed at the ROUTER, deliberately — there is no "is this
 *                   yours?" question for a global row.
 *
 * vendorPerformance Ratings hang off a WorkOrder -> MaintenanceRequest -> Rental
 *                   chain. The read side here is deliberately narrow: a rating
 *                   carries the reviewer's free-text `comment` about a vendor.
 *                   Only the operator who owns the rental and the vendor who was
 *                   rated may read it.
 *
 * tenantIssuePrediction
 *                   `GET /` returns EVERY prediction for EVERY tenant with no
 *                   filter at all. `POST /predict/:tenantId` runs prediction on
 *                   an arbitrary tenant id and, in the fallback path, discloses
 *                   that tenant's derived risk score.
 *
 * A NOTE ON `emergencyResponse`
 * -----------------------------
 * `/api/emergency-response` is NOT included in the tenancy assertions below on
 * purpose. `services/emergencyResponse.service.ts` contains zero Prisma calls —
 * all 21 handlers return hardcoded fixture data and several only `console.log`.
 * There is no row to authorize and no tenant data to leak, so a tenancy test
 * would be asserting against a mock and could never redden. It is a fake
 * feature, not an authorization hole; recorded as such rather than papered over
 * with a green test. The one genuine defect it has (module-scope state) is
 * covered separately.
 */

let server: http.Server;

describe('Property-scoped surfaces: tenancy and write gating', () => {
  // Two independent landlords, each with one rental, plus a resident of A.
  let admin: { id: string; token: string };
  let landlordA: { id: string; token: string };
  let landlordB: { id: string; token: string };
  let residentA: { id: string; token: string };
  let vendorUser: { id: string; token: string };

  let rentalAId: string;
  let rentalBId: string;
  let policyAId: string;
  let scheduleAId: string;
  let whiteLabelAId: string;
  let vendorAId: string;
  let workOrderAId: string;
  let workOrderA2Id: string;
  let ratingAId: string;
  let predictionAId: string;
  let otherTenant: { id: string; token: string };

  const signToken = (id: string, role: UserRole): string =>
    jwt.sign({ id, role }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

  const mkUser = async (email: string, role: UserRole) => {
    const user = await prisma.user.create({
      data: {
        email,
        // Sentinel: if this appears in any response, a User row was serialised.
        password: 'SENTINEL-BCRYPT-HASH-DO-NOT-LEAK',
        firstName: role,
        lastName: 'Fixture',
        role,
        mfaEnabled: true,
        mfaSecret: 'SENTINEL-MFA-SECRET-DO-NOT-LEAK',
      },
    });
    return { id: user.id, token: signToken(user.id, role) };
  };

  // `slug` is `String @unique` with NO default — the create CONTROLLER
  // auto-generates it when absent, but a direct Prisma fixture must supply it.
  const mkRental = async (managerId: string, title: string) =>
    prisma.rental.create({
      data: {
        title,
        address: `${title} Street`,
        city: 'Edmonton',
        state: 'AB',
        zipCode: 'T5J0N9',
        propertyType: 'APARTMENT',
        rent: 1500,
        slug: `${title.toLowerCase()}-property-fixture`,
        managerId,
        ownerId: managerId,
        createdById: managerId,
      },
    });

  beforeAll(async () => {
    server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    // Reset AFTER listen(0) and BEFORE any fixture — a suite that resets only in
    // afterAll is order-dependent (a neighbour truncating first deletes the
    // fixture user, and requireAuth re-hydrates from Postgres -> every 401).
    await resetDatabase(prisma);

    admin = await mkUser('ps-admin@example.com', UserRole.ADMIN);
    landlordA = await mkUser('ps-landlord-a@example.com', UserRole.PROPERTY_MANAGER);
    landlordB = await mkUser('ps-landlord-b@example.com', UserRole.PROPERTY_MANAGER);
    residentA = await mkUser('ps-resident-a@example.com', UserRole.TENANT);
    vendorUser = await mkUser('ps-vendor@example.com', UserRole.VENDOR);

    const rentalA = await mkRental(landlordA.id, 'Alpha');
    const rentalB = await mkRental(landlordB.id, 'Bravo');
    rentalAId = rentalA.id;
    rentalBId = rentalB.id;

    // The resident of A holds a lease on A. This is the link that must grant a
    // READ and must NOT grant a WRITE.
    await prisma.lease.create({
      data: {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-01-01'),
        rentAmount: 1500,
        securityDeposit: 750,
        rentalId: rentalAId,
        tenantId: residentA.id,
      },
    });

    const policyA = await prisma.escalationPolicy.create({
      data: { name: 'Alpha escalation', rentalId: rentalAId },
    });
    policyAId = policyA.id;
    await prisma.escalationPolicyRule.create({
      data: {
        policyId: policyAId,
        order: 1,
        action: 'notify',
        threshold: '30m',
        assignedToUserId: landlordA.id,
      },
    });

    const scheduleA = await prisma.onCallSchedule.create({
      data: { name: 'Alpha on-call', rentalId: rentalAId },
    });
    scheduleAId = scheduleA.id;

    const wlA = await prisma.whiteLabelConfig.create({
      data: {
        platform: 'ios',
        token: 'SENTINEL-WHITELABEL-TOKEN-DO-NOT-LEAK',
        userId: landlordA.id,
        appName: 'Alpha App',
        Rental: { connect: { id: rentalAId } },
      },
    });
    whiteLabelAId = wlA.id;

    const vendorA = await prisma.vendor.create({
      data: {
        name: 'Alpha Plumbing',
        phone: '780-555-0001',
        email: 'alpha-plumbing@example.com',
        address: '1 Vendor Way',
        specialty: 'plumbing',
        availability: 'weekdays',
        certifications: [],
        serviceAreas: [],
      },
    });
    vendorAId = vendorA.id;

    const mrA = await prisma.maintenanceRequest.create({
      data: {
        title: 'Leaky faucet',
        description: 'Kitchen tap drips',
        rentalId: rentalAId,
        requestedById: residentA.id,
      },
    });
    const woA = await prisma.workOrder.create({
      data: {
        title: 'Fix leaky faucet',
        description: 'Replace cartridge',
        priority: 'MEDIUM',
        maintenanceRequestId: mrA.id,
      },
    });
    workOrderAId = woA.id;

    const ratingA = await prisma.vendorPerformanceRating.create({
      data: {
        vendorId: vendorAId,
        workOrderId: workOrderAId,
        ratedById: landlordA.id,
        rating: 4,
        comment: 'SENTINEL-VENDOR-COMMENT-ALPHA',
      },
    });
    ratingAId = ratingA.id;

    // A SECOND work order on the same rental, with no rating yet. The rating
    // table is `@@unique([vendorId, workOrderId])`, so re-posting the pair above
    // would 500 on the constraint and leave the "ratedById comes from the token"
    // assertion passing vacuously — it would only ever see the fixture row.
    const mrA2 = await prisma.maintenanceRequest.create({
      data: {
        title: 'Broken heater',
        description: 'No heat in unit 2',
        rentalId: rentalAId,
        requestedById: residentA.id,
      },
    });
    const woA2 = await prisma.workOrder.create({
      data: {
        title: 'Repair heater',
        description: 'Replace igniter',
        priority: 'HIGH',
        maintenanceRequestId: mrA2.id,
      },
    });
    workOrderA2Id = woA2.id;

    const prediction = await prisma.tenantIssuePrediction.create({
      data: {
        tenantId: residentA.id,
        issueType: 'lease_termination_risk',
        likelihood: 0.82,
      },
    });
    predictionAId = prediction.id;

    // A second tenant, unrelated to any of the landlords above. Without a row
    // that does NOT belong to residentA, the "resident sees only their own rows"
    // assertion passes even when the handler returns the entire table.
    otherTenant = await mkUser('ps-other-tenant@example.com', UserRole.TENANT);
    await prisma.tenantIssuePrediction.create({
      data: {
        tenantId: otherTenant.id,
        issueType: 'late_payment_risk',
        likelihood: 0.91,
      },
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  });

  /* ===================================================================== *
   * escalationPolicy
   * ===================================================================== */
  describe('escalation policies', () => {
    it('lets the owning landlord read their own policies', async () => {
      const res = await request(server)
        .get(`/api/escalation-policies/properties/${rentalAId}/escalation-policies`)
        .set('Authorization', `Bearer ${landlordA.token}`);
      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body)).toContain(policyAId);
    });

    it('does not let another landlord enumerate my policies', async () => {
      const res = await request(server)
        .get(`/api/escalation-policies/properties/${rentalAId}/escalation-policies`)
        .set('Authorization', `Bearer ${landlordB.token}`);
      expect(res.status).toBe(403);
      expect(JSON.stringify(res.body)).not.toContain(policyAId);
    });

    it('does not let a resident of the property rewrite its policies', async () => {
      const res = await request(server)
        .put(`/api/escalation-policies/escalation-policies/${policyAId}`)
        .set('Authorization', `Bearer ${residentA.token}`)
        .send({ name: 'Hijacked by tenant' });
      expect(res.status).toBe(403);

      const after = await prisma.escalationPolicy.findUnique({ where: { id: policyAId } });
      expect(after?.name).toBe('Alpha escalation');
    });

    it('cannot create a policy on another landlord’s rental via rentalId in the body', async () => {
      const res = await request(server)
        .post('/api/escalation-policies/escalation-policies')
        .set('Authorization', `Bearer ${landlordB.token}`)
        .send({ name: 'Injected policy', rentalId: rentalAId });

      expect([403, 400]).toContain(res.status);
      const created = await prisma.escalationPolicy.findFirst({
        where: { name: 'Injected policy' },
      });
      expect(created).toBeNull();
    });

    it('cannot delete another landlord’s policy', async () => {
      const res = await request(server)
        .delete(`/api/escalation-policies/escalation-policies/${policyAId}`)
        .set('Authorization', `Bearer ${landlordB.token}`);
      expect(res.status).toBe(403);

      const after = await prisma.escalationPolicy.findUnique({ where: { id: policyAId } });
      expect(after).not.toBeNull();
    });

    it('lets an admin read any property’s policies', async () => {
      const res = await request(server)
        .get(`/api/escalation-policies/properties/${rentalAId}/escalation-policies`)
        .set('Authorization', `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
    });
  });

  /* ===================================================================== *
   * onCall
   * ===================================================================== */
  describe('on-call schedules', () => {
    it('lets the owning landlord read their own schedules', async () => {
      const res = await request(server)
        .get(`/api/on-call/properties/${rentalAId}/on-call-schedules`)
        .set('Authorization', `Bearer ${landlordA.token}`);
      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body)).toContain(scheduleAId);
    });

    it('does not let another landlord enumerate my on-call schedules', async () => {
      const res = await request(server)
        .get(`/api/on-call/properties/${rentalAId}/on-call-schedules`)
        .set('Authorization', `Bearer ${landlordB.token}`);
      expect(res.status).toBe(403);
      expect(JSON.stringify(res.body)).not.toContain(scheduleAId);
    });

    it('cannot hang a rotation onto another landlord’s schedule', async () => {
      const res = await request(server)
        .post('/api/on-call/on-call-rotations')
        .set('Authorization', `Bearer ${landlordB.token}`)
        .send({
          scheduleId: scheduleAId,
          userId: landlordB.id,
          startDate: '2025-02-01T00:00:00.000Z',
          endDate: '2025-02-08T00:00:00.000Z',
        });

      expect([403, 400]).toContain(res.status);
      const rotations = await prisma.onCallRotation.findMany({
        where: { scheduleId: scheduleAId },
      });
      expect(rotations).toHaveLength(0);
    });

    it('cannot delete another landlord’s schedule', async () => {
      const res = await request(server)
        .delete(`/api/on-call/on-call-schedules/${scheduleAId}`)
        .set('Authorization', `Bearer ${landlordB.token}`);
      expect(res.status).toBe(403);

      const after = await prisma.onCallSchedule.findUnique({ where: { id: scheduleAId } });
      expect(after).not.toBeNull();
    });
  });

  /* ===================================================================== *
   * whiteLabel — the config row carries `token`
   * ===================================================================== */
  describe('white-label config', () => {
    it('lets the owning landlord read their own config, without leaking the token', async () => {
      const res = await request(server)
        .get(`/api/white-label/properties/${rentalAId}/white-label-config`)
        .set('Authorization', `Bearer ${landlordA.token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('appName', 'Alpha App');
      // The token is a bearer-style secret for the branded app. It must never
      // appear in a read response, even to the owner.
      expect(JSON.stringify(res.body)).not.toContain('SENTINEL-WHITELABEL-TOKEN-DO-NOT-LEAK');
    });

    it('does not let another landlord read my white-label config', async () => {
      const res = await request(server)
        .get(`/api/white-label/properties/${rentalAId}/white-label-config`)
        .set('Authorization', `Bearer ${landlordB.token}`);
      expect(res.status).toBe(403);
      expect(JSON.stringify(res.body)).not.toContain('Alpha App');
      expect(JSON.stringify(res.body)).not.toContain('SENTINEL-WHITELABEL-TOKEN-DO-NOT-LEAK');
    });

    it('cannot re-point a white-label config at another landlord’s rental', async () => {
      const res = await request(server)
        .put(`/api/white-label/white-label-config/${whiteLabelAId}`)
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({ rentalId: rentalBId, appName: 'Stolen' });

      // Either refused outright, or accepted with the ownership link untouched.
      const after = await prisma.whiteLabelConfig.findUnique({
        where: { id: whiteLabelAId },
        include: { Rental: { select: { id: true } } },
      });
      expect(after?.Rental.map((r) => r.id)).toContain(rentalAId);
      expect(after?.Rental.map((r) => r.id)).not.toContain(rentalBId);
      if (res.status !== 200) {
        expect([400, 403]).toContain(res.status);
      }
    });

    it('cannot delete another landlord’s white-label config', async () => {
      const res = await request(server)
        .delete(`/api/white-label/white-label-config/${whiteLabelAId}`)
        .set('Authorization', `Bearer ${landlordB.token}`);
      expect(res.status).toBe(403);

      const after = await prisma.whiteLabelConfig.findUnique({ where: { id: whiteLabelAId } });
      expect(after).not.toBeNull();
    });
  });

  /* ===================================================================== *
   * languages — a GLOBAL table. Reads open, writes operator-only.
   * ===================================================================== */
  describe('languages (global reference data)', () => {
    it('lets any authenticated user read the language list', async () => {
      const res = await request(server)
        .get('/api/languages/languages')
        .set('Authorization', `Bearer ${residentA.token}`);
      expect(res.status).toBe(200);
    });

    it('does not let a resident add a language', async () => {
      const res = await request(server)
        .post('/api/languages/languages')
        .set('Authorization', `Bearer ${residentA.token}`)
        .send({ code: 'xx-injected', name: 'Injected' });
      expect(res.status).toBe(403);

      const created = await prisma.language.findUnique({ where: { code: 'xx-injected' } });
      expect(created).toBeNull();
    });

    it('does not let a resident delete a language', async () => {
      const seeded = await prisma.language.create({
        data: { code: 'en-ca', name: 'English (Canada)' },
      });
      const res = await request(server)
        .delete(`/api/languages/languages/${seeded.id}`)
        .set('Authorization', `Bearer ${residentA.token}`);
      expect(res.status).toBe(403);

      const after = await prisma.language.findUnique({ where: { id: seeded.id } });
      expect(after).not.toBeNull();
    });

    it('lets an admin add a language', async () => {
      const res = await request(server)
        .post('/api/languages/languages')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ code: 'fr-ca', name: 'French (Canada)' });
      expect(res.status).toBe(201);
    });
  });

  /* ===================================================================== *
   * vendorPerformance — ratings hang off WorkOrder -> Rental
   * ===================================================================== */
  describe('vendor performance ratings', () => {
    it('lets the owning landlord read a rating on their work order', async () => {
      const res = await request(server)
        .get(`/api/vendor-performance/${ratingAId}`)
        .set('Authorization', `Bearer ${landlordA.token}`);
      expect(res.status).toBe(200);
    });

    it('does not let another landlord read a rating on my work order', async () => {
      const res = await request(server)
        .get(`/api/vendor-performance/${ratingAId}`)
        .set('Authorization', `Bearer ${landlordB.token}`);
      expect(res.status).toBe(403);
      expect(JSON.stringify(res.body)).not.toContain('SENTINEL-VENDOR-COMMENT-ALPHA');
    });

    it('does not let an unrelated user enumerate ratings for my vendor', async () => {
      const res = await request(server)
        .get(`/api/vendor-performance/vendor/${vendorAId}`)
        .set('Authorization', `Bearer ${landlordB.token}`);
      expect(res.status).toBe(403);
      expect(JSON.stringify(res.body)).not.toContain('SENTINEL-VENDOR-COMMENT-ALPHA');
    });

    it('stamps ratedById from the token, never from the body', async () => {
      const res = await request(server)
        .post('/api/vendor-performance/')
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({
          vendorId: vendorAId,
          // A fresh work order, so this create genuinely runs instead of dying
          // on `@@unique([vendorId, workOrderId])`.
          workOrderId: workOrderA2Id,
          rating: 5,
          comment: 'Great work',
          // Impersonation attempt: must be ignored.
          ratedById: landlordB.id,
        });

      const created = await prisma.vendorPerformanceRating.findFirst({
        where: { workOrderId: workOrderA2Id },
      });
      // If the handler refused the impersonation by rejecting the body (400),
      // that is acceptable; quietly filing the row under the VICTIM is not.
      if (created) {
        expect(created.ratedById).toBe(landlordA.id);
        expect(created.ratedById).not.toBe(landlordB.id);
      } else {
        expect([400, 403]).toContain(res.status);
      }
    });
  });

  /* ===================================================================== *
   * tenantIssuePrediction
   * ===================================================================== */
  describe('tenant issue predictions', () => {
    it('does not dump every tenant’s predictions to an unrelated landlord', async () => {
      const res = await request(server)
        .get('/api/tenant-issue-prediction/')
        .set('Authorization', `Bearer ${landlordB.token}`);

      // A landlord with no tenants sees an empty list — not everyone's.
      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body)).not.toContain(residentA.id);
    });

    it('does not let a resident list the whole prediction table', async () => {
      const res = await request(server)
        .get('/api/tenant-issue-prediction/')
        .set('Authorization', `Bearer ${residentA.token}`);
      // Either scoped to their own rows or refused; never the full table.
      expect(res.status).toBe(200);
      const body = res.body as unknown;
      const list = Array.isArray(body) ? body : ((body as any).data ?? []);
      for (const row of list as Array<{ tenantId?: string }>) {
        expect(row.tenantId).toBe(residentA.id);
      }
      // And the other tenant's row must be absent — without this, the loop above
      // passes on a single-row table even when the handler returns everything.
      expect(JSON.stringify(res.body)).not.toContain(otherTenant.id);
    });

    it('does not let an unrelated landlord read a specific prediction', async () => {
      const res = await request(server)
        .get(`/api/tenant-issue-prediction/${predictionAId}`)
        .set('Authorization', `Bearer ${landlordB.token}`);
      expect(res.status).toBe(403);
      expect(JSON.stringify(res.body)).not.toContain('lease_termination_risk');
    });

    it('stops a landlord predicting issues for a tenant that is not theirs', async () => {
      const outsider = await mkUser('ps-outsider-tenant@example.com', UserRole.TENANT);
      const res = await request(server)
        .post(`/api/tenant-issue-prediction/predict/${outsider.id}`)
        .set('Authorization', `Bearer ${landlordB.token}`);
      // 403 is the intended answer. A 500 (prediction service blowing up) would
      // also not disclose anything, but it is a different bug — assert 403.
      expect(res.status).toBe(403);
    });

    it('lets an admin see every prediction', async () => {
      const res = await request(server)
        .get('/api/tenant-issue-prediction/')
        .set('Authorization', `Bearer ${admin.token}`);
      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body)).toContain(residentA.id);
    });
  });

  /* ===================================================================== *
   * Cross-cutting: no response on any of these may serialise a User row.
   * ===================================================================== */
  describe('response hygiene', () => {
    it('never serialises a User credential on these surfaces', async () => {
      const probes: Array<[string, string]> = [
        ['get', `/api/escalation-policies/properties/${rentalAId}/escalation-policies`],
        ['get', `/api/on-call/properties/${rentalAId}/on-call-schedules`],
        ['get', `/api/white-label/properties/${rentalAId}/white-label-config`],
        ['get', `/api/vendor-performance/${ratingAId}`],
        ['get', '/api/tenant-issue-prediction/'],
      ];

      for (const [verb, path] of probes) {
        const res = await (request(server) as any)[verb](path)
          .set('Authorization', `Bearer ${admin.token}`);
        const raw = JSON.stringify(res.body);
        expect(raw).not.toContain('SENTINEL-BCRYPT-HASH-DO-NOT-LEAK');
        expect(raw).not.toContain('SENTINEL-MFA-SECRET-DO-NOT-LEAK');
        expect(raw).not.toContain('passwordHistory');
        expect(raw).not.toContain('mfaSecret');
      }
    });
  });
});
