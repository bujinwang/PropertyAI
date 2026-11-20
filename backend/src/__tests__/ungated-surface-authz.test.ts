import http from 'http';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { app } from '../app';
import { prisma } from '../config/database';
import { resetDatabase } from './testDb';

/**
 * Access control on the surfaces that were still guarded by AUTHENTICATION ALONE.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `app.use('/api', requireAuth)` (src/app.ts:139) authenticates every request
 * before the route barrel is mounted. That was intended as a deny-by-default
 * backstop, but it has a side effect that hid a whole class of bug: a router
 * with NO middleware of its own still *appears* protected, because an anonymous
 * caller gets 401. Only an authenticated-but-unprivileged caller reveals that
 * there is no authorization at all.
 *
 * Four routers were in that state:
 *
 *   /api/manual-review   any authenticated user could APPROVE ANY application,
 *                        including their own, and list every pending one. This
 *                        is the worst of the four: a tenant could self-approve.
 *   /api/appliances      no tenancy in either direction. `updateAppliance`
 *                        forwarded `req.body` straight into Prisma, so any
 *                        authenticated user could re-point an appliance at
 *                        another landlord's rental (`rentalId` is writable).
 *   /api/marketing       `protect` only, and the controller never reads
 *                        `req.user` at all. Campaigns and promotions are global
 *                        spend records any logged-in user could edit or delete.
 *                        `GET /syndication/platforms` returned `apiKey` and
 *                        `apiSecret` in plain text.
 *   /api/knowledge-base  shared reference content: any authenticated user could
 *                        rewrite or delete every entry.
 *
 * WHAT IS ASSERTED
 * ----------------
 * Not "the route is behind auth" (it already was, which is why no test caught
 * this) but "an unprivileged caller cannot perform the privileged action, and a
 * privileged caller still can". Every "must succeed" case is present so a fix
 * cannot pass by locking everyone out.
 */

let server: http.Server;

describe('Authenticated-but-unauthorized surfaces', () => {
  let admin: { id: string; token: string };
  let landlordA: { id: string; token: string };
  let landlordB: { id: string; token: string };
  let tenantA: { id: string; token: string };
  let tenantB: { id: string; token: string };

  let rentalAId: string;
  let rentalBId: string;
  let pendingApplicationAId: string;
  let pendingApplicationBId: string;
  let applianceAId: string;
  let applianceBId: string;
  let campaignId: string;
  let promotionId: string;
  let platformId: string;
  let kbEntryId: string;

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
    // after listen(0), before any fixture: otherwise run 2 of this file dies on
    // a unique-email violation before the first assertion executes.
    await resetDatabase(prisma);

    admin = await mkUser('ungated-admin@example.com', UserRole.ADMIN);
    landlordA = await mkUser('ungated-landlord-a@example.com', UserRole.PROPERTY_MANAGER);
    landlordB = await mkUser('ungated-landlord-b@example.com', UserRole.PROPERTY_MANAGER);
    tenantA = await mkUser('ungated-tenant-a@example.com', UserRole.TENANT);
    tenantB = await mkUser('ungated-tenant-b@example.com', UserRole.TENANT);

    const rentalA = await mkRental(landlordA.id, 'Ungated A', '1 Ungated Way', 'ungated-a');
    const rentalB = await mkRental(landlordB.id, 'Ungated B', '2 Ungated Way', 'ungated-b');
    rentalAId = rentalA.id;
    rentalBId = rentalB.id;

    const appA = await prisma.application.create({
      data: {
        rentalId: rentalAId,
        applicantId: tenantA.id,
        notes: 'Please approve me',
        status: 'PENDING',
      },
    });
    const appB = await prisma.application.create({
      data: {
        rentalId: rentalBId,
        applicantId: tenantB.id,
        notes: 'Other applicant',
        status: 'PENDING',
      },
    });
    pendingApplicationAId = appA.id;
    pendingApplicationBId = appB.id;

    const applA = await prisma.appliance.create({
      data: { rentalId: rentalAId, name: 'A Fridge', type: 'REFRIGERATOR' },
    });
    const applB = await prisma.appliance.create({
      data: { rentalId: rentalBId, name: 'B Fridge', type: 'REFRIGERATOR' },
    });
    applianceAId = applA.id;
    applianceBId = applB.id;

    const campaign = await prisma.marketingCampaign.create({
      data: {
        name: 'Q1 Spend',
        type: 'EMAIL',
        budget: 5000,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-03-31'),
        description: 'Confidential budget',
      },
    });
    campaignId = campaign.id;

    const promotion = await prisma.promotion.create({
      data: {
        name: 'Launch Discount',
        type: 'DISCOUNT',
        code: 'LAUNCH10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      },
    });
    promotionId = promotion.id;

    const platform = await prisma.syndicationPlatform.create({
      data: {
        name: 'Zillow',
        apiKey: 'SUPER-SECRET-API-KEY',
        apiSecret: 'SUPER-SECRET-API-SECRET',
        status: 'CONNECTED',
      },
    });
    platformId = platform.id;

    const kb = await prisma.knowledgeBaseEntry.create({
      data: {
        question: 'How do I reset my password?',
        answer: 'Use the forgot-password link.',
        category: 'ACCOUNT',
        keywords: ['password'],
      },
    });
    kbEntryId = kb.id;
  });

  afterAll(async () => {
    await resetDatabase(prisma);
    await prisma.$disconnect();
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // ------------------------------------------------------- manual-review ---
  describe('/api/manual-review', () => {
    it('does not let a tenant approve their own application', async () => {
      const res = await request(server)
        .put(`/api/manual-review/${pendingApplicationAId}/approve`)
        .set('Authorization', `Bearer ${tenantA.token}`);

      expect(res.status).toBe(403);

      const after = await prisma.application.findUnique({
        where: { id: pendingApplicationAId },
      });
      expect(after?.status).toBe('PENDING');
    });

    it('does not let a tenant approve a stranger’s application', async () => {
      const res = await request(server)
        .put(`/api/manual-review/${pendingApplicationBId}/approve`)
        .set('Authorization', `Bearer ${tenantA.token}`);

      expect(res.status).toBe(403);

      const after = await prisma.application.findUnique({
        where: { id: pendingApplicationBId },
      });
      expect(after?.status).toBe('PENDING');
    });

    it('does not let a tenant reject a stranger’s application', async () => {
      const res = await request(server)
        .put(`/api/manual-review/${pendingApplicationBId}/reject`)
        .set('Authorization', `Bearer ${tenantA.token}`);

      expect(res.status).toBe(403);

      const after = await prisma.application.findUnique({
        where: { id: pendingApplicationBId },
      });
      expect(after?.status).toBe('PENDING');
    });

    it('does not let a tenant list the review queue', async () => {
      const res = await request(server)
        .get('/api/manual-review')
        .set('Authorization', `Bearer ${tenantA.token}`);

      expect(res.status).toBe(403);
      expect(JSON.stringify(res.body)).not.toContain(pendingApplicationBId);
    });

    it('lets the landlord who controls the rental approve', async () => {
      const res = await request(server)
        .put(`/api/manual-review/${pendingApplicationAId}/approve`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(200);

      const after = await prisma.application.findUnique({
        where: { id: pendingApplicationAId },
      });
      expect(after?.status).toBe('APPROVED');
    });

    it('does not let a different landlord approve it', async () => {
      const res = await request(server)
        .put(`/api/manual-review/${pendingApplicationBId}/approve`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(403);

      const after = await prisma.application.findUnique({
        where: { id: pendingApplicationBId },
      });
      expect(after?.status).toBe('PENDING');
    });

    it('lets ADMIN approve across landlords', async () => {
      const res = await request(server)
        .put(`/api/manual-review/${pendingApplicationBId}/approve`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);

      const after = await prisma.application.findUnique({
        where: { id: pendingApplicationBId },
      });
      expect(after?.status).toBe('APPROVED');
    });
  });

  // --------------------------------------------------------- appliances ---
  describe('/api/appliances', () => {
    it('hides another landlord’s appliance on read', async () => {
      const res = await request(server)
        .get(`/api/appliances/appliances/${applianceBId}`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(403);
      expect(JSON.stringify(res.body)).not.toContain('B Fridge');
    });

    it('shows the owning landlord their own appliance', async () => {
      const res = await request(server)
        .get(`/api/appliances/appliances/${applianceAId}`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(applianceAId);
    });

    it('scopes the by-rental list', async () => {
      const res = await request(server)
        .get(`/api/appliances/rentals/${rentalBId}/appliances`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(403);
    });

    it('refuses a create against a rental the caller does not control', async () => {
      const res = await request(server)
        .post('/api/appliances/appliances')
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({ rentalId: rentalBId, name: 'Sneaky Stove', type: 'OVEN' });

      expect(res.status).toBe(403);

      const count = await prisma.appliance.count({ where: { rentalId: rentalBId } });
      expect(count).toBe(1);
    });

    it('allows a create against the caller’s own rental', async () => {
      const res = await request(server)
        .post('/api/appliances/appliances')
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({ rentalId: rentalAId, name: 'A Dishwasher', type: 'DISHWASHER' });

      expect(res.status).toBe(201);
      expect(res.body.rentalId).toBe(rentalAId);
    });

    it('refuses a tenant creating an appliance on the home they rent', async () => {
      // Residents may REPORT a fault (maintenance) but not add capital assets.
      const res = await request(server)
        .post('/api/appliances/appliances')
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({ rentalId: rentalAId, name: 'Tenant Fridge', type: 'REFRIGERATOR' });

      expect(res.status).toBe(403);
    });

    it('cannot re-point an appliance at another landlord’s rental', async () => {
      const res = await request(server)
        .put(`/api/appliances/appliances/${applianceAId}`)
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({ rentalId: rentalBId, name: 'Hijacked' });

      // The tenancy key is not writable: silently ignored or rejected, but the
      // row must still belong to rental A afterwards.
      expect([200, 400, 403]).toContain(res.status);

      const after = await prisma.appliance.findUnique({ where: { id: applianceAId } });
      expect(after?.rentalId).toBe(rentalAId);
    });

    it('refuses a delete of another landlord’s appliance', async () => {
      const res = await request(server)
        .delete(`/api/appliances/appliances/${applianceBId}`)
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(403);

      const still = await prisma.appliance.findUnique({ where: { id: applianceBId } });
      expect(still).not.toBeNull();
    });
  });

  // ---------------------------------------------------------- marketing ---
  describe('/api/marketing', () => {
    it('never returns syndication apiKey / apiSecret', async () => {
      const res = await request(server)
        .get('/api/marketing/syndication/platforms')
        .set('Authorization', `Bearer ${landlordA.token}`);

      expect(res.status).toBe(200);
      const serialised = JSON.stringify(res.body);
      expect(serialised).not.toContain('SUPER-SECRET-API-KEY');
      expect(serialised).not.toContain('SUPER-SECRET-API-SECRET');
    });

    it('refuses a tenant editing campaign budget', async () => {
      const res = await request(server)
        .put(`/api/marketing/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({ budget: 1 });

      expect(res.status).toBe(403);

      const after = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
      expect(after?.budget).toBe(5000);
    });

    it('refuses a tenant deleting a campaign', async () => {
      const res = await request(server)
        .delete(`/api/marketing/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${tenantA.token}`);

      expect(res.status).toBe(403);

      const still = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
      expect(still).not.toBeNull();
    });

    it('refuses a tenant deleting a promotion', async () => {
      const res = await request(server)
        .delete(`/api/marketing/promotions/${promotionId}`)
        .set('Authorization', `Bearer ${tenantA.token}`);

      expect(res.status).toBe(403);

      const still = await prisma.promotion.findUnique({ where: { id: promotionId } });
      expect(still).not.toBeNull();
    });

    it('refuses a tenant rewriting a syndication platform', async () => {
      const res = await request(server)
        .put(`/api/marketing/syndication/platforms/${platformId}`)
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({ status: 'DISCONNECTED' });

      expect(res.status).toBe(403);

      const after = await prisma.syndicationPlatform.findUnique({ where: { id: platformId } });
      expect(after?.status).toBe('CONNECTED');
    });

    it('lets an operator update a campaign', async () => {
      const res = await request(server)
        .put(`/api/marketing/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${landlordA.token}`)
        .send({ budget: 6000 });

      expect(res.status).toBe(200);

      const after = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
      expect(after?.budget).toBe(6000);
    });
  });

  // --------------------------------------------------- knowledge base ----
  describe('/api/knowledge-base', () => {
    it('lets any authenticated user read shared content', async () => {
      const res = await request(server)
        .get(`/api/knowledge-base/${kbEntryId}`)
        .set('Authorization', `Bearer ${tenantA.token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(kbEntryId);
    });

    it('refuses a tenant rewriting shared content', async () => {
      const res = await request(server)
        .put(`/api/knowledge-base/${kbEntryId}`)
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({ answer: 'Compromised answer' });

      expect(res.status).toBe(403);

      const after = await prisma.knowledgeBaseEntry.findUnique({ where: { id: kbEntryId } });
      expect(after?.answer).toBe('Use the forgot-password link.');
    });

    it('refuses a tenant deleting shared content', async () => {
      const res = await request(server)
        .delete(`/api/knowledge-base/${kbEntryId}`)
        .set('Authorization', `Bearer ${tenantA.token}`);

      expect(res.status).toBe(403);

      const still = await prisma.knowledgeBaseEntry.findUnique({ where: { id: kbEntryId } });
      expect(still).not.toBeNull();
    });

    it('lets an admin create and update content', async () => {
      const created = await request(server)
        .post('/api/knowledge-base')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          question: 'What is the late fee?',
          answer: 'It is stated in your lease.',
          category: 'PAYMENTS',
          keywords: ['late'],
        });

      expect(created.status).toBe(201);

      const updated = await request(server)
        .put(`/api/knowledge-base/${created.body.id}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ answer: 'Updated answer' });

      expect(updated.status).toBe(200);
      expect(updated.body.answer).toBe('Updated answer');
    });
  });
});
