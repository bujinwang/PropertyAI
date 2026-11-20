import http from 'http';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { app } from '../app';
import { prisma } from '../config/database';
import { resetDatabase } from './testDb';

/**
 * `/api/tenant/*` — tenant sentiment analytics
 * (`sentiment-trends`, `common-issues`, `early-warnings`, `proactive-suggestions`)
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `controllers/tenantAnalyticsController.ts` reads `req.user` ZERO times and is
 * mounted at `/api/tenant` (via `routes/index.ts:100`) behind
 * `authMiddleware.protect`. So an anonymous probe gets 401 and the surface
 * *looks* protected, exactly like the six routers closed in the previous pass.
 *
 * THE BUG IS NOT "NO FILTER", IT IS "AN OPTIONAL FILTER"
 * -----------------------------------------------------
 * Every endpoint takes `rentalId` from the QUERY STRING:
 *
 *     const { timeframe = '30d', rentalId } = req.query;
 *     if (rentalId) {                       // <-- omit it and you get EVERYONE
 *       whereClause.MaintenanceRequest = { rentalId: rentalId as string };
 *     }
 *
 * `timeframe` has a default; `rentalId` does not. Omitting a query parameter is
 * the default behaviour of every HTTP client, so the *normal* request returns a
 * cross-tenant dump. That is the same shape as the unscoped `xScopeFilter`
 * family: an optional filter is not a filter, it is an opt-in.
 *
 * `rentalId` is also an unvalidated pointer — passing another landlord's id
 * reads their portfolio, because nothing resolves the rental before using it.
 *
 * AND ONE QUERY IS UNFILTERED EVEN WHEN `rentalId` IS SUPPLIED
 * -----------------------------------------------------------
 * `getEarlyWarnings` runs a second query (`recentNegativeTrends`, line 282)
 * that has NO rentalId filter at all, and feeds it into `escalationRisks`,
 * which is keyed by `senderId`. Supplying a correct `rentalId` therefore still
 * discloses which tenants at *other* landlords' properties are "HIGH risk".
 *
 * WHY THE FIXTURES ARE SHAPED THIS WAY
 * -----------------------------------
 * A negative assertion ("B's sentinel is absent") passes for free if B's data
 * was never created. So every exclusion below is paired with a POSITIVE
 * CONTROL: the ADMIN request must still return the same row. If the fixture
 * silently stops being created, the control fails and the exclusion cannot
 * pretend to hold.
 *
 * The two landlords deliberately have DIFFERENT message counts (2 vs 3). With
 * equal counts, "A sees only 2" and "A sees the whole table" are
 * indistinguishable when the table has 4 rows.
 *
 * `Message.maintenanceRequestId` IS NULLABLE — A POLICY, NOT AN OVERSIGHT
 * ----------------------------------------------------------------------
 * `Message` has no `rentalId`; its only tenancy path is
 * `Message -> MaintenanceRequest -> Rental`. A message with a null
 * `maintenanceRequestId` (a general conversation) therefore has NO resolvable
 * property and is NOT property analytics. The assertions below pin that it is
 * invisible to both landlords and visible only to ADMIN — i.e. excluded by
 * policy rather than dropped by accident.
 */

let server: http.Server;

describe('/api/tenant analytics: scoping', () => {
  let admin: { id: string; token: string };
  let landlordA: { id: string; token: string };
  let landlordB: { id: string; token: string };
  let landlordEmpty: { id: string; token: string };
  let residentA: { id: string; token: string };
  let residentB: { id: string; token: string };
  let coTenant: { id: string; token: string };

  let rentalAId: string;
  let rentalBId: string;

  const signToken = (id: string, role: UserRole): string =>
    jwt.sign({ id, role }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

  const mkUser = async (email: string, role: UserRole) => {
    const user = await prisma.user.create({
      data: {
        email,
        // Sentinel: if this appears in any response, a User row was serialised.
        password: 'SENTINEL-BCRYPT-HASH-DO-NOT-LEAK',
        firstName: 'First',
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
        slug: `${title.toLowerCase()}-analytics-fixture`,
        managerId,
        ownerId: managerId,
        createdById: managerId,
      },
    });

  const mkMessage = (data: {
    content: string;
    senderId: string;
    receiverId: string;
    maintenanceRequestId?: string;
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    sentimentScore: number;
    category?: string;
    isEarlyWarning?: boolean;
  }) => prisma.message.create({ data });

  const get = (token: string, path: string) =>
    request(server).get(`/api/tenant${path}`).set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    // Reset AFTER listen(0) and BEFORE any fixture — resetting only in afterAll
    // is order-dependent (a neighbour truncating first deletes the fixture user,
    // and requireAuth re-hydrates from Postgres -> every request 401s).
    await resetDatabase(prisma);

    admin = await mkUser('ta-admin@example.com', UserRole.ADMIN);
    landlordA = await mkUser('ta-landlord-a@example.com', UserRole.PROPERTY_MANAGER);
    landlordB = await mkUser('ta-landlord-b@example.com', UserRole.PROPERTY_MANAGER);
    landlordEmpty = await mkUser('ta-landlord-empty@example.com', UserRole.PROPERTY_MANAGER);
    residentA = await mkUser('ta-resident-a@example.com', UserRole.TENANT);
    residentB = await mkUser('ta-resident-b@example.com', UserRole.TENANT);

    const rentalA = await mkRental(landlordA.id, 'Alpha');
    const rentalB = await mkRental(landlordB.id, 'Bravo');
    rentalAId = rentalA.id;
    rentalBId = rentalB.id;

    // The resident of A holds a lease on A — the link that makes them a
    // legitimate participant in A's messages, and the link that must NOT let
    // them read other tenants' complaints.
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

    const mrA = await prisma.maintenanceRequest.create({
      data: {
        title: 'Kitchen leak',
        description: 'Tap drips',
        rentalId: rentalAId,
        requestedById: residentA.id,
      },
    });
    const mrB = await prisma.maintenanceRequest.create({
      data: {
        title: 'No heat',
        description: 'Furnace dead',
        rentalId: rentalBId,
        requestedById: residentB.id,
      },
    });

    // ---- Landlord A: TWO negative messages from their tenant.
    // Two is the threshold for `escalationRisks`, so A's tenant is a risk
    // *at A's property* — the legitimate case that must keep working.
    await mkMessage({
      content: 'SENTINEL-MSG-ALPHA plumbing leak under the kitchen sink',
      senderId: residentA.id,
      receiverId: landlordA.id,
      maintenanceRequestId: mrA.id,
      sentiment: 'NEGATIVE',
      sentimentScore: -0.8,
      category: 'plumbing',
      isEarlyWarning: true,
    });
    await mkMessage({
      content: 'SENTINEL-MSG-ALPHA-TWO plumbing still leaking badly',
      senderId: residentA.id,
      receiverId: landlordA.id,
      maintenanceRequestId: mrA.id,
      sentiment: 'NEGATIVE',
      sentimentScore: -0.7,
      category: 'plumbing',
    });

    // ---- Landlord B: THREE negative messages. Deliberately a different count
    // from A, so "A sees 2" cannot be satisfied by "A sees every row".
    await mkMessage({
      content: 'SENTINEL-MSG-BRAVO hvac is completely broken',
      senderId: residentB.id,
      receiverId: landlordB.id,
      maintenanceRequestId: mrB.id,
      sentiment: 'NEGATIVE',
      sentimentScore: -0.9,
      category: 'hvac',
      isEarlyWarning: true,
    });
    await mkMessage({
      content: 'SENTINEL-MSG-BRAVO-TWO hvac still broken',
      senderId: residentB.id,
      receiverId: landlordB.id,
      maintenanceRequestId: mrB.id,
      sentiment: 'NEGATIVE',
      sentimentScore: -0.85,
      category: 'hvac',
    });
    await mkMessage({
      content: 'SENTINEL-MSG-BRAVO-THREE hvac broken a third time',
      senderId: residentB.id,
      receiverId: landlordB.id,
      maintenanceRequestId: mrB.id,
      sentiment: 'NEGATIVE',
      sentimentScore: -0.75,
      category: 'hvac',
    });
    await mkMessage({
      content: 'SENTINEL-MSG-BRAVO-FOUR hvac broken a fourth time',
      senderId: residentB.id,
      receiverId: landlordB.id,
      maintenanceRequestId: mrB.id,
      sentiment: 'NEGATIVE',
      sentimentScore: -0.72,
      category: 'hvac',
    });

    // ---- A SECOND SENDER on rental A whose message the first resident must
    // never see. Without this row, `?rentalId=<own rental>` and a token-scoped
    // query return the same thing, because residentA is the only sender on the
    // property — so a handler that let `rentalId` REPLACE the token scope
    // instead of NARROWING it would still pass. This row tells them apart.
    //
    // NOTE: no Lease here, deliberately. `Lease.rentalId` is `@unique` (one
    // lease per rental, no renewals), so a genuine co-tenant is not
    // representable in this schema. That does not weaken the assertion: the
    // sender only has to exist and to have messaged about rental A.
    coTenant = await mkUser('ta-co-tenant@example.com', UserRole.TENANT);
    await mkMessage({
      content: 'SENTINEL-MSG-COTENANT my neighbour is a problem, same building',
      senderId: coTenant.id,
      receiverId: landlordA.id,
      maintenanceRequestId: mrA.id,
      sentiment: 'NEGATIVE',
      sentimentScore: -0.8,
      category: 'noise_complaint',
      isEarlyWarning: true,
    });

    // ---- The ORPHAN: no `maintenanceRequestId`, therefore no rental, therefore
    // no landlord it belongs to. Sent by residentB so that it is NOT reachable
    // through the resident branch either (which scopes on `senderId`).
    await mkMessage({
      content: 'SENTINEL-MSG-ORPHAN general complaint not tied to any property',
      senderId: residentB.id,
      receiverId: admin.id,
      sentiment: 'NEGATIVE',
      sentimentScore: -0.9,
      category: 'plumbing',
      isEarlyWarning: true,
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  });

  /* ===================================================================== *
   * Aggregates: the collection must be scoped, not merely filterable
   * ===================================================================== */

  describe('sentiment-trends', () => {
    it('counts only the caller portfolio, not the whole table', async () => {
      const a = await get(landlordA.token, '/sentiment-trends');
      expect(a.status).toBe(200);
      // A has 3 (two from residentA, one from the co-tenant). The table has 8.
      expect(a.body.data.summary.totalMessages).toBe(3);

      const b = await get(landlordB.token, '/sentiment-trends');
      expect(b.status).toBe(200);
      expect(b.body.data.summary.totalMessages).toBe(4);

      // Positive control: ADMIN is unrestricted, so the fixture really holds 8.
      const all = await get(admin.token, '/sentiment-trends');
      expect(all.status).toBe(200);
      expect(all.body.data.summary.totalMessages).toBe(8);
    });

    it('excludes a message that belongs to no property', async () => {
      // The orphan is real and reachable — ADMIN sees it. It is invisible to a
      // landlord because a message with no maintenance request has no rental,
      // so it is not property analytics. Pinned as policy, not as an accident.
      const a = await get(landlordA.token, '/sentiment-trends');
      const b = await get(landlordB.token, '/sentiment-trends');
      const all = await get(admin.token, '/sentiment-trends');

      expect(all.body.data.summary.totalMessages).toBe(8);
      expect(a.body.data.summary.totalMessages + b.body.data.summary.totalMessages).toBe(7);
    });

    it('returns a truthful zero for a landlord with no messages', async () => {
      const empty = await get(landlordEmpty.token, '/sentiment-trends');
      expect(empty.status).toBe(200);
      expect(empty.body.data.summary.totalMessages).toBe(0);
      expect(empty.body.data.trends).toEqual([]);
      // A sum divided by zero messages is not a number. `JSON.stringify(NaN)`
      // turns it into `null`, which is what an empty portfolio used to return.
      expect(empty.body.data.summary.averageScore).toBe(0);
    });
  });

  describe('common-issues', () => {
    it('never returns another landlord complaint text', async () => {
      const a = await get(landlordA.token, '/common-issues');
      expect(a.status).toBe(200);

      const body = JSON.stringify(a.body);
      expect(body).toContain('SENTINEL-MSG-ALPHA');
      expect(body).not.toContain('SENTINEL-MSG-BRAVO');
      expect(body).not.toContain('SENTINEL-MSG-ORPHAN');
      expect(body).not.toContain('Bravo');
    });

    it('keeps ADMIN as a full positive control', async () => {
      const all = await get(admin.token, '/common-issues');
      expect(all.status).toBe(200);
      const body = JSON.stringify(all.body);
      // Proves the excluded rows exist — the exclusions above are not vacuous.
      expect(body).toContain('SENTINEL-MSG-BRAVO');
      expect(body).toContain('SENTINEL-MSG-ORPHAN');
    });
  });

  describe('early-warnings', () => {
    it('scopes BOTH the warning list and the escalation risks', async () => {
      const a = await get(landlordA.token, '/early-warnings');
      expect(a.status).toBe(200);

      const body = JSON.stringify(a.body);
      expect(body).toContain('SENTINEL-MSG-ALPHA');
      expect(body).not.toContain('SENTINEL-MSG-BRAVO');
      expect(body).not.toContain('SENTINEL-MSG-ORPHAN');

      // `escalationRisks` is keyed by senderId and comes from a SECOND query
      // that ignored `rentalId` entirely. Even a correctly scoped warning list
      // leaked which of B's tenants is high risk.
      expect(body).not.toContain(residentB.id);
      const risks = a.body.data.escalationRisks as Array<{ senderId: string }>;
      expect(risks.map((r) => r.senderId)).toEqual([residentA.id]);
    });

    it('is not made vacuous by an unfiltered second query', async () => {
      // Per-landlord expected risk counts: residentA has 2 negatives -> MEDIUM,
      // residentB has 4 -> HIGH, and the co-tenant has 1 -> below threshold.
      // If the escalation query stays unscoped, landlord A reports all three
      // tenants and this length/count check diverges.
      const a = await get(landlordA.token, '/early-warnings');
      const b = await get(landlordB.token, '/early-warnings');
      const all = await get(admin.token, '/early-warnings');

      const aRisks = a.body.data.escalationRisks as Array<{ senderId: string; riskLevel: string }>;
      const bRisks = b.body.data.escalationRisks as Array<{ senderId: string; riskLevel: string }>;
      const allRisks = all.body.data.escalationRisks as Array<{ senderId: string }>;

      expect(aRisks.map((r) => r.senderId)).toEqual([residentA.id]);
      expect(aRisks[0].riskLevel).toBe('MEDIUM');
      expect(bRisks.map((r) => r.senderId)).toEqual([residentB.id]);
      expect(bRisks[0].riskLevel).toBe('HIGH');
      // Positive control: the unscoped view sees both landlords' tenants.
      expect(allRisks).toHaveLength(2);
    });
  });

  describe('proactive-suggestions', () => {
    it('does not name another landlord property', async () => {
      const a = await get(landlordA.token, '/proactive-suggestions');
      expect(a.status).toBe(200);
      const body = JSON.stringify(a.body);
      expect(body).not.toContain('Bravo');
      expect(body).not.toContain('hvac');
    });

    it('still produces a suggestion for the caller own portfolio', async () => {
      // Guard against "fixed by returning nothing". A's 2 plumbing complaints
      // average below -0.3, which must yield a plumbing suggestion.
      const a = await get(landlordA.token, '/proactive-suggestions');
      const suggestions = a.body.data.suggestions as Array<{ category?: string }>;
      expect(suggestions.some((s) => s.category === 'plumbing')).toBe(true);

      const all = await get(admin.token, '/proactive-suggestions');
      const adminCats = (all.body.data.suggestions as Array<{ category?: string }>).map(
        (s) => s.category
      );
      expect(adminCats).toContain('plumbing');
      expect(adminCats).toContain('hvac');
    });
  });

  /* ===================================================================== *
   * `rentalId` is a pointer, so it has to be authorized before it is used
   * ===================================================================== */

  describe('rentalId query parameter', () => {
    it('rejects another landlord rental with 403 on every endpoint', async () => {
      for (const path of [
        '/sentiment-trends',
        '/common-issues',
        '/early-warnings',
        '/proactive-suggestions',
      ]) {
        const res = await get(landlordA.token, `${path}?rentalId=${rentalBId}`);
        expect(res.status).toBe(403);
      }
    });

    it('accepts the caller own rental and narrows to it', async () => {
      const res = await get(landlordA.token, `/sentiment-trends?rentalId=${rentalAId}`);
      expect(res.status).toBe(200);
      // Rental A holds all 3 of landlord A's messages, so narrowing changes
      // nothing here — this is the "legal request still works" guard.
      expect(res.body.data.summary.totalMessages).toBe(3);
    });

    it('answers 404 for a rental that does not exist, not 403', async () => {
      // Existence is checked before access, so a typo gets a truthful
      // "not found" instead of a misleading "forbidden".
      const res = await get(landlordA.token, '/sentiment-trends?rentalId=does-not-exist');
      expect(res.status).toBe(404);
    });
  });

  /* ===================================================================== *
   * Residents: participants, not operators
   * ===================================================================== */

  describe('resident scope', () => {
    it('sees only their own messages and no other tenant identity', async () => {
      const res = await get(residentA.token, '/early-warnings');
      expect(res.status).toBe(200);
      const body = JSON.stringify(res.body);
      expect(body).toContain('SENTINEL-MSG-ALPHA');
      expect(body).not.toContain('SENTINEL-MSG-BRAVO');
      expect(body).not.toContain('SENTINEL-MSG-ORPHAN');
      expect(body).not.toContain(residentB.id);
    });

    it('is scoped on EVERY endpoint, not just early-warnings', async () => {
      // Pinned because a mutation that emptied ONLY the resident branch left the
      // whole suite green except `early-warnings` — the other three handlers were
      // never exercised as a resident, so their scope was inspected by nobody.
      // A resident's own messages are 2; the table holds 6.
      const trends = await get(residentA.token, '/sentiment-trends');
      expect(trends.status).toBe(200);
      expect(trends.body.data.summary.totalMessages).toBe(2);

      const issues = await get(residentA.token, '/common-issues');
      expect(issues.status).toBe(200);
      expect(JSON.stringify(issues.body)).not.toContain('SENTINEL-MSG-BRAVO');

      const suggestions = await get(residentA.token, '/proactive-suggestions');
      expect(suggestions.status).toBe(200);
      expect(JSON.stringify(suggestions.body)).not.toContain('Bravo');
    });

    it('cannot enumerate another landlord portfolio by rentalId', async () => {
      const res = await get(residentA.token, `/sentiment-trends?rentalId=${rentalBId}`);
      expect(res.status).toBe(403);
    });

    it('may still narrow to the home they lease', async () => {
      const res = await get(residentA.token, `/sentiment-trends?rentalId=${rentalAId}`);
      expect(res.status).toBe(200);
      // THE KEY ASSERTION FOR "AND, NEVER OVERWRITE".
      // Rental A holds 3 messages: 2 from this resident and 1 from the
      // co-tenant. A token-scoped query NARROWED by the rentalId is still 2.
      // A query where `rentalId` REPLACED the token scope would return all 3 —
      // which is why the co-tenant message exists. Without it, both readings
      // agree and this handler's scope is pinned by nobody.
      expect(res.body.data.summary.totalMessages).toBe(2);
    });
  });
});
