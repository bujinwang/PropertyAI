import http from 'http';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { UserRole } from '@prisma/client';
import { app } from '../app';
import { prisma } from '../config/database';
import { resetDatabase } from './testDb';
import { AiContent } from '../models/mongoModels';

/**
 * `/api/ai-content` — AI-generated content authoring (7 handlers)
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `routes/aiContentRoutes.ts` reads `req.user` ZERO times across all seven
 * handlers. It is mounted at `/api/ai-content` through the barrel
 * (`routes/index.ts:94`), so `app.use('/api', requireAuth)` gives it a 401 for
 * anonymous probes and the surface *looks* protected. Only `DELETE /:id`
 * carries real middleware; every other handler is authenticated-but-ungated.
 *
 * Four distinct defects are pinned below.
 *
 * 1. NO ROLE GATE ON A BILLED OPERATION
 *    `POST /generate` calls `generativeAIService.generateText(prompt)`, which
 *    hits Gemini (billed per token) with a `prompt` taken straight from the
 *    request body. Any authenticated TENANT can therefore spend the platform's
 *    AI budget an unbounded number of times with an unbounded prompt.
 *
 * 2. BODY-SUPPLIED ATTRIBUTION
 *    `POST /generate` sets `createdBy: userId` from `req.body`, and
 *    `POST /:id/feedback` sets `userId` from `req.body`. A caller can therefore
 *    write content — and post feedback — AS ANOTHER USER. Worse, `userId` is
 *    also a REQUIRED FIELD, so generation is impossible unless the caller sends
 *    an id: the endpoint has no notion of "me" at all.
 *
 * 3. NoSQL OPERATOR INJECTION IN `GET /`
 *    Express 4's default `extended` query parser turns `?status[$ne]=draft`
 *    into the OBJECT `{ $ne: 'draft' }`, and the handler assigns that value
 *    straight into a Mongoose filter (`filter.status = status`). All five
 *    filter fields are injectable.
 *
 * 4. MASS ASSIGNMENT IN `PUT /:id`
 *    `findOneAndUpdate(..., { $set: req.body })` writes the caller's whole
 *    object. `status`, `createdBy`, `contentId`, `usageMetrics`, `feedback` and
 *    `revisionHistory` are all settable directly — which walks straight past
 *    `POST /:id/publish`, whose "already published" guard then means nothing.
 *
 * THE POLICY CHOICE (global row -> gate on the ROUTER)
 * ---------------------------------------------------
 * Per the project rule, a GLOBAL row is closed with a role gate on the router;
 * only an OWNED/parented row needs a per-row controller check. `AiContent` has
 * no tenancy path at all — `createdBy` is a bare `String`, there is no `Rental`
 * foreign key, and `relatedEntityId`/`relatedEntityType` are untyped strings
 * with no referential integrity. So there is no row to compare against a
 * caller, and no meaningful "is this YOUR row" question.
 *
 * Chosen split, matching the evident intent of the endpoints:
 *   - writes (`generate`, `update`, `publish`) -> ADMIN / PROPERTY_MANAGER / OWNER
 *   - `delete`                                  -> ADMIN (unchanged, tighter)
 *   - reads (`GET /`, `GET /:id`)               -> any authenticated user,
 *                                                  but DRAFTS ARE OPERATOR-ONLY
 *   - feedback                                  -> any authenticated user
 *
 * The draft narrowing is a deliberate decision, not a side effect: `status` is
 * `draft | published | archived`, and a draft is unpublished working copy.
 *
 * TEST-CRAFT NOTES
 * ----------------
 * - Every `POST /generate` below sends `userId`, because a REQUEST that omits
 *   it gets a 400 for a missing field. Without it, a 400 would masquerade as
 *   "the authorization gate worked" and the test would prove nothing.
 * - The mass-assignment test uses a DEDICATED row (`MUTABLE_ID`). Reusing a
 *   shared fixture would let the pre-fix bug (which rewrites `contentId`)
 *   destroy rows that later assertions depend on, turning one failure into a
 *   cascade that reads as unrelated bugs.
 * - Listing counts are derived from the database rather than hard-coded, since
 *   the generate tests insert rows earlier in the file.
 * - Negative assertions are paired with positive controls: hiding drafts must
 *   not also hide published rows, otherwise an empty result would satisfy them.
 *
 * WHY MONGO IS CONNECTED HERE
 * ---------------------------
 * `app.ts` never opens a Mongo connection (only `index.ts` does), and no other
 * suite touches Mongo, so this file owns its own connection lifecycle against a
 * dedicated throwaway database. `mongoModels` registers on the DEFAULT mongoose
 * connection, which is what a plain `mongoose.connect` supplies.
 */

// `POST /generate` must never reach a real model from a test suite. The mock is
// also the instrument that proves the role gate runs BEFORE the spend.
jest.mock('../services/generativeAI.service', () => ({
  generativeAIService: {
    generateText: jest.fn().mockResolvedValue('MOCK-GENERATED-CONTENT'),
    analyzeImage: jest.fn().mockResolvedValue('MOCK'),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { generativeAIService } = require('../services/generativeAI.service');

/**
 * A dedicated, throwaway Mongo database for this suite.
 *
 * Derived from `MONGODB_URI` rather than hardcoded, because the credentials
 * differ by environment: locally the default is unauthenticated
 * (`mongodb://localhost:27017/propertyai`), while CI runs the `mongo:4.4`
 * service with `MONGO_INITDB_ROOT_USERNAME/PASSWORD=admin` and points
 * `MONGODB_URI` at `mongodb://admin:admin@localhost:27017/propertyai_test`.
 * Hardcoding either form makes this suite pass on one machine and fail on the
 * other.
 *
 * The database NAME is replaced, not the host: the suite drops it in `beforeAll`
 * and `afterAll`, so it must never be the database the application itself uses.
 */
function mongoTestUri(): string {
  const base = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/propertyai';
  const url = new URL(base); // throws on a malformed URI — deliberately
  // Fail loudly rather than falling back to `base`. This suite DROPS its
  // database in beforeAll/afterAll; silently using an unparsed connection
  // string would risk dropping the application's real database.
  if (!url.pathname || url.pathname === '/' || url.pathname === '') {
    throw new Error(
      `Refusing to run: MONGODB_URI has no database name, so a throwaway test database cannot be derived from it (${base}).`
    );
  }
  url.pathname = '/propertyai_test_ai_content';
  return url.toString();
}

const MONGO_TEST_URI = mongoTestUri();

let server: http.Server;

describe('/api/ai-content: authorization, injection, mass assignment', () => {
  let admin: { id: string; token: string };
  let operator: { id: string; token: string };
  let owner: { id: string; token: string };
  let tenant: { id: string; token: string };
  let plainUser: { id: string; token: string };

  const signToken = (id: string, role: UserRole): string =>
    jwt.sign({ id, role }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

  const mkUser = async (email: string, role: UserRole) => {
    const user = await prisma.user.create({
      data: {
        email,
        // Sentinel: if this value shows up in a response, a User row leaked.
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

  const mkContent = (data: Record<string, unknown>) =>
    AiContent.create({
      contentId: `cid-${Math.random().toString(36).slice(2)}`,
      contentType: 'listing-description',
      originalPrompt: 'prompt',
      generatedContent: 'body',
      modelName: 'gemini-2.5-pro',
      ...data,
    });

  const get = (token: string | null, path: string) => {
    const r = request(server).get(`/api/ai-content${path}`);
    return token ? r.set('Authorization', `Bearer ${token}`) : r;
  };
  const post = (token: string | null, path: string, body: unknown = {}) => {
    const r = request(server).post(`/api/ai-content${path}`).send(body as object);
    return token ? r.set('Authorization', `Bearer ${token}`) : r;
  };
  const put = (token: string, path: string, body: unknown) =>
    request(server)
      .put(`/api/ai-content${path}`)
      .set('Authorization', `Bearer ${token}`)
      .send(body as object);
  const del = (token: string, path: string) =>
    request(server).delete(`/api/ai-content${path}`).set('Authorization', `Bearer ${token}`);

  // Distinct, stable content ids so assertions can name a specific row.
  const DRAFT_ID = 'fixture-draft-alpha';
  const PUBLISHED_ID = 'fixture-published-bravo';
  const SECOND_PUBLISHED_ID = 'fixture-published-charlie';
  const MUTABLE_ID = 'fixture-mutable-delta';

  const publishedCount = () => AiContent.countDocuments({ status: 'published' });
  const totalCount = () => AiContent.countDocuments({});

  beforeAll(async () => {
    await mongoose.connect(MONGO_TEST_URI, { serverSelectionTimeoutMS: 5000 });
    await mongoose.connection.db?.dropDatabase();

    server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    // Reset AFTER listen(0) and BEFORE fixtures — resetting only in afterAll is
    // order-dependent, and `requireAuth` re-hydrates the user from Postgres, so
    // a neighbour truncating first turns every request into a 401.
    await resetDatabase(prisma);

    admin = await mkUser('aic-admin@example.com', UserRole.ADMIN);
    operator = await mkUser('aic-operator@example.com', UserRole.PROPERTY_MANAGER);
    owner = await mkUser('aic-owner@example.com', UserRole.OWNER);
    tenant = await mkUser('aic-tenant@example.com', UserRole.TENANT);
    plainUser = await mkUser('aic-user@example.com', UserRole.USER);

    // One draft (unpublished working copy) and THREE published rows. The uneven
    // counts matter: with one row per status, "sees only published" and "sees
    // everything" are indistinguishable.
    await mkContent({
      contentId: DRAFT_ID,
      status: 'draft',
      generatedContent: 'SENTINEL-DRAFT-CONTENT unfinished',
      createdBy: operator.id,
    });
    await mkContent({
      contentId: PUBLISHED_ID,
      status: 'published',
      generatedContent: 'SENTINEL-PUBLISHED-CONTENT one',
      createdBy: operator.id,
    });
    await mkContent({
      contentId: SECOND_PUBLISHED_ID,
      status: 'published',
      contentType: 'email-template',
      generatedContent: 'SENTINEL-PUBLISHED-CONTENT two',
      createdBy: admin.id,
    });
    await mkContent({
      contentId: MUTABLE_ID,
      status: 'published',
      generatedContent: 'SENTINEL-MUTABLE-ORIGINAL',
      createdBy: operator.id,
    });
  }, 60000);

  afterAll(async () => {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.connection.db?.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(() => {
    (generativeAIService.generateText as jest.Mock).mockClear();
  });

  // ---------------------------------------------------------------- baseline
  it('rejects an anonymous request (the global mount, not the router)', async () => {
    const res = await get(null, '/');
    expect(res.status).toBe(401);
    // Documented so this file does not over-claim: a 401 here proves nothing
    // about the router. It is `app.use('/api', requireAuth)` doing the work.
  });

  // ------------------------------------------------- 1. read narrowing on drafts
  it('hides drafts from a non-operator listing', async () => {
    const res = await get(tenant.token, '/');
    expect(res.status).toBe(200);

    const body = JSON.stringify(res.body);
    expect(body).not.toContain('SENTINEL-DRAFT-CONTENT');
    // Positive control: published rows MUST survive, otherwise the exclusion
    // above would pass for free on an empty result.
    expect(body).toContain('SENTINEL-PUBLISHED-CONTENT one');
    expect(body).toContain('SENTINEL-PUBLISHED-CONTENT two');
    expect(res.body.count).toBe(await publishedCount());
  });

  it('hides drafts from a non-operator asking for them explicitly', async () => {
    const res = await get(tenant.token, '/?status=draft');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  it('shows drafts to an operator', async () => {
    const res = await get(operator.token, '/');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(await totalCount());
    expect(JSON.stringify(res.body)).toContain('SENTINEL-DRAFT-CONTENT');
  });

  it('refuses a single draft by id to a non-operator', async () => {
    const res = await get(tenant.token, `/${DRAFT_ID}`);
    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body ?? {})).not.toContain('SENTINEL-DRAFT-CONTENT');
  });

  it('allows a non-operator to read published content by id (over-restriction guard)', async () => {
    const res = await get(tenant.token, `/${PUBLISHED_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.contentId).toBe(PUBLISHED_ID);
  });

  // ----------------------------------------------- 3. NoSQL operator injection
  it('does not execute a Mongo operator supplied through ?status', async () => {
    // Non-operators are narrowed to `published`. The injection asks for
    // everything that is NOT published — i.e. exactly the drafts the narrowing
    // exists to hide. `{ $ne: 'published' }` would return the draft; a literal
    // string match returns nothing.
    const res = await get(tenant.token, '/?status[$ne]=published');

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body ?? {})).not.toContain('SENTINEL-DRAFT-CONTENT');
  });

  it('does not execute an operator supplied through ?contentType', async () => {
    // `{ $ne: 'nope' }` matches EVERY row if it reaches Mongoose.
    const res = await get(tenant.token, '/?contentType[$ne]=nope');
    expect(res.status).toBe(400);
  });

  it('does not execute an operator supplied through ?tags', async () => {
    const res = await get(tenant.token, '/?tags[$ne]=nope');
    expect(res.status).toBe(400);
  });

  it('accepts a plain-string filter and actually applies it', async () => {
    // Over-restriction guard: rejecting objects must not reject all queries.
    const res = await get(tenant.token, '/?contentType=email-template');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].contentId).toBe(SECOND_PUBLISHED_ID);
  });

  // ------------------------------------------- 2. billed generation is gated
  it('refuses AI generation to a tenant WITHOUT spending a model call', async () => {
    const res = await post(tenant.token, '/generate', {
      contentType: 'listing-description',
      prompt: 'Write marketing copy for my landlord',
      modelName: 'gemini-2.5-pro',
      // Sent on purpose: omitting it would earn a 400 for a missing field and
      // disguise the missing authorization as a validation success.
      userId: tenant.id,
    });

    expect(res.status).toBe(403);
    // The decisive assertion: the billed call must not have happened. A gate
    // placed after `generateText` would still 403 while still charging.
    expect(generativeAIService.generateText).not.toHaveBeenCalled();
  });

  it('refuses AI generation to a plain USER', async () => {
    const res = await post(plainUser.token, '/generate', {
      contentType: 'listing-description',
      prompt: 'x',
      modelName: 'gemini-2.5-pro',
      userId: plainUser.id,
    });
    expect(res.status).toBe(403);
    expect(generativeAIService.generateText).not.toHaveBeenCalled();
  });

  it('allows an operator to generate', async () => {
    const res = await post(operator.token, '/generate', {
      contentType: 'listing-description',
      prompt: 'Write marketing copy',
      modelName: 'gemini-2.5-pro',
      userId: operator.id,
    });
    expect(res.status).toBe(201);
    expect(generativeAIService.generateText).toHaveBeenCalledTimes(1);
    expect(res.body.data.generatedContent).toBe('MOCK-GENERATED-CONTENT');
  });

  it('allows an OWNER to generate (over-restriction guard)', async () => {
    const res = await post(owner.token, '/generate', {
      contentType: 'listing-description',
      prompt: 'Write marketing copy',
      modelName: 'gemini-2.5-pro',
      userId: owner.id,
    });
    expect(res.status).toBe(201);
  });

  it('generates without requiring a body-supplied userId', async () => {
    // The token already identifies the caller. Requiring `userId` in the body
    // is what forced callers to name *someone*, which is how impersonation
    // became the normal path rather than the abuse case.
    const res = await post(operator.token, '/generate', {
      contentType: 'listing-description',
      prompt: 'No userId in this body',
      modelName: 'gemini-2.5-pro',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.createdBy).toBe(operator.id);
  });

  // --------------------------------------- 2. attribution comes from the token
  it('ignores a body-supplied userId when attributing generated content', async () => {
    const res = await post(operator.token, '/generate', {
      contentType: 'listing-description',
      prompt: 'Attribute me to the tenant',
      modelName: 'gemini-2.5-pro',
      // A real deployment sees this exact shape: the dashboard sends the
      // "current user" it happens to be holding.
      userId: tenant.id,
    });

    expect(res.status).toBe(201);
    // Attribution must be the CALLER, never the body. Asserting only that the
    // request succeeded would leave the impersonation intact.
    expect(res.body.data.createdBy).toBe(operator.id);
    expect(res.body.data.createdBy).not.toBe(tenant.id);
  });

  it('records feedback under the caller, not the body-supplied userId', async () => {
    const res = await post(tenant.token, `/${PUBLISHED_ID}/feedback`, {
      rating: 5,
      comments: 'great copy',
      userId: operator.id, // attempting to post AS the operator
    });

    expect(res.status).toBe(200);
    const stored = await AiContent.findOne({ contentId: PUBLISHED_ID });
    const feedback = (stored?.feedback ?? []) as Array<{ userId: string; rating: number }>;
    const last = feedback[feedback.length - 1];
    expect(last.userId).toBe(tenant.id);
    expect(last.userId).not.toBe(operator.id);
  });

  it('still validates the feedback rating', async () => {
    const res = await post(tenant.token, `/${PUBLISHED_ID}/feedback`, { rating: 9 });
    expect(res.status).toBe(400);
  });

  // ------------------------------------------------------ 4. mass assignment
  it('ignores privileged fields smuggled through PUT', async () => {
    const res = await put(operator.token, `/${MUTABLE_ID}`, {
      generatedContent: 'SENTINEL-MUTABLE-EDITED',
      // None of the following may be written by a plain update:
      status: 'published-and-then-some',
      createdBy: tenant.id,
      contentId: 'hijacked-id',
      usageMetrics: { views: 99999, conversions: 99999, engagement: 99999 },
    });

    expect(res.status).toBe(200);

    const stored = await AiContent.findOne({ contentId: MUTABLE_ID });
    // The row must still be findable by its ORIGINAL id — `$set:req.body`
    // rewrites `contentId` and orphaned the row pre-fix.
    expect(stored).not.toBeNull();
    // The legitimate field did change...
    expect(stored?.generatedContent).toBe('SENTINEL-MUTABLE-EDITED');
    // ...and every privileged one did not.
    expect(stored?.status).toBe('published');
    expect(stored?.createdBy).toBe(operator.id);
    expect(stored?.usageMetrics?.views).toBe(0);
    expect(await AiContent.findOne({ contentId: 'hijacked-id' })).toBeNull();
  });

  it('still writes the revision history when content changes', async () => {
    // Self-contained: normalise the row first so this does not depend on the
    // previous test having run (order-dependent suites read as flaky).
    await AiContent.updateOne(
      { contentId: MUTABLE_ID },
      { $set: { generatedContent: 'SENTINEL-MUTABLE-BASE', revisionHistory: [] } }
    );

    const res = await put(operator.token, `/${MUTABLE_ID}`, {
      generatedContent: 'SENTINEL-MUTABLE-SECOND-EDIT',
    });

    expect(res.status).toBe(200);
    const after = await AiContent.findOne({ contentId: MUTABLE_ID });
    const history = (after?.revisionHistory ?? []) as Array<{ content: string }>;
    expect(history.length).toBe(1);
    expect(history[0].content).toBe('SENTINEL-MUTABLE-BASE');
    expect(after?.generatedContent).toBe('SENTINEL-MUTABLE-SECOND-EDIT');
  });

  it('refuses PUT to a tenant', async () => {
    const res = await put(tenant.token, `/${PUBLISHED_ID}`, { generatedContent: 'pwned' });
    expect(res.status).toBe(403);

    const stored = await AiContent.findOne({ contentId: PUBLISHED_ID });
    expect(stored?.generatedContent).toBe('SENTINEL-PUBLISHED-CONTENT one');
  });

  it('refuses publish to a tenant', async () => {
    const res = await post(tenant.token, `/${DRAFT_ID}/publish`);
    expect(res.status).toBe(403);

    const stored = await AiContent.findOne({ contentId: DRAFT_ID });
    expect(stored?.status).toBe('draft');
  });

  // ------------------------------------------------------- prompt size / cost
  it('rejects an oversized prompt before spending a model call', async () => {
    const res = await post(operator.token, '/generate', {
      contentType: 'listing-description',
      prompt: 'x'.repeat(20001),
      modelName: 'gemini-2.5-pro',
      userId: operator.id,
    });

    expect(res.status).toBe(400);
    expect(generativeAIService.generateText).not.toHaveBeenCalled();
  });

  // --------------------------------------------------- delete stays admin-only
  it('refuses DELETE to a non-admin operator', async () => {
    const res = await del(operator.token, `/${SECOND_PUBLISHED_ID}`);
    expect(res.status).toBe(403);
    expect(await AiContent.findOne({ contentId: SECOND_PUBLISHED_ID })).not.toBeNull();
  });

  it('allows ADMIN to delete', async () => {
    const res = await del(admin.token, `/${SECOND_PUBLISHED_ID}`);
    expect(res.status).toBe(200);
    expect(await AiContent.findOne({ contentId: SECOND_PUBLISHED_ID })).toBeNull();
  });
});
