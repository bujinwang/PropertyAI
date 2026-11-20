// @ts-nocheck
/**
 * `GET /api/ai/usage-stats` — a permanently broken endpoint that leaks the ORM.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The handler queries `AIUsageLog` with column names that DO NOT EXIST:
 *
 *     where:     { feature: type, createdAt: { gte, lte } }
 *     orderBy:   { createdAt: 'desc' }
 *
 * The real model (prisma/schema.prisma) is:
 *
 *     model AIUsageLog {
 *       id        String
 *       userId    String?
 *       toolName  String        <-- NOT `feature`
 *       input     Json?
 *       output    Json?
 *       cost      Float?
 *       timestamp DateTime      <-- NOT `createdAt`
 *     }
 *
 * Because the call is wrapped in `(prisma as any)`, `tsc` cannot see the
 * mismatch — this is the SAME defect class as Session 12's
 * `feature`/`prompt`/`response` write bug, in a READ path that was missed then.
 *
 * THE CONSEQUENCE IS TWO BUGS, not one:
 *   1. The endpoint can never succeed. Every request throws
 *      `PrismaClientValidationError` — with no filter, with a `type`, and with
 *      a date range alike, because `orderBy: { createdAt }` is unconditional.
 *   2. The `catch` returns `error.message`, and Prisma's validation message
 *      embeds the model name, the unknown argument, AND the full list of
 *      available options:
 *
 *        Unknown argument `createdAt`. Available options are marked with ?.
 *        ... AIUsageLogOrderByWithRelationInput, AIUsageLogWhereInput ...
 *
 *      So any authenticated caller receives the ORM's internal schema shape.
 *      Memory records that "prod `message` exposes ORM internals, no path" —
 *      that is exactly what this asserts, and here it is reachable on a live route.
 *
 * WHAT IS ASSERTED
 *  1. The endpoint returns 200 for an unfiltered request (it is a read of the
 *     caller's own rows — a legitimate request must work).
 *  2. It returns 200 with a `type` filter and maps that filter onto `toolName`.
 *  3. It returns 200 with a date range and maps it onto `timestamp`.
 *  4. It orders by `timestamp`, so the newest row comes first.
 *  5. A failure does NOT echo `PrismaClientValidationError` / `Unknown argument`
 *     / model-type names to the client.
 *  6. It is scoped to the caller — another user's rows never appear.
 *
 * Assertion 5 is written to pin the STATUS first. Without that it would pass
 * for free while the endpoint 200s (the Session 13 mutation-C lesson).
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { prisma } from '../config/database';
import { resetDatabase } from './testDb';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

let token: string;
let userId: string;
let otherUserId: string;

beforeAll(async () => {
  await resetDatabase(prisma);

  const user = await prisma.user.create({
    data: {
      email: 'usage-stats@example.com',
      password: 'hashed-not-used',
      firstName: 'Usage',
      lastName: 'Stats',
      role: 'ADMIN',
    },
  });
  const other = await prisma.user.create({
    data: {
      email: 'usage-stats-other@example.com',
      password: 'hashed-not-used',
      firstName: 'Other',
      lastName: 'User',
      role: 'ADMIN',
    },
  });
  userId = user.id;
  otherUserId = other.id;
  token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);

  // Three rows for the caller with DISTINCT toolNames and timestamps, so
  // ordering and filtering are both observable. A fourth belongs to another
  // user: scoping is only testable if there is something to leak.
  await prisma.aIUsageLog.createMany({
    data: [
      { userId, toolName: 'text_generation', input: 'a', output: 'b', timestamp: new Date('2026-01-01T00:00:00Z') },
      { userId, toolName: 'sentiment_analysis', input: 'a', output: 'b', timestamp: new Date('2026-02-01T00:00:00Z') },
      { userId, toolName: 'text_generation', input: 'a', output: 'b', timestamp: new Date('2026-03-01T00:00:00Z') },
      { userId: otherUserId, toolName: 'someone_elses_tool', input: 'x', output: 'y', timestamp: new Date('2026-04-01T00:00:00Z') },
    ],
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

const get = (qs = '') =>
  request(app).get(`/api/ai/usage-stats${qs}`).set('Authorization', `Bearer ${token}`);

describe('GET /api/ai/usage-stats — the query names columns that exist', () => {
  it('returns 200 for an unfiltered request (currently always 500)', async () => {
    const res = await get();

    // Pre-fix this is 500: `orderBy: { createdAt }` is unconditional, so even a
    // bare request fails validation before any row is read.
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total).toBe(3);
  });

  it('orders by `timestamp` descending, newest first', async () => {
    const res = await get();

    expect(res.status).toBe(200);
    const tools = res.body.data.usage.map((r: any) => r.toolName);
    // Newest (Mar) before Feb before Jan.
    expect(tools[0]).toBe('text_generation');
    expect(tools[1]).toBe('sentiment_analysis');
  });

  it('maps the `type` filter onto `toolName`', async () => {
    const res = await get('?type=sentiment_analysis');

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.usage[0].toolName).toBe('sentiment_analysis');
  });

  it('maps the date range onto `timestamp` and keeps only rows inside it', async () => {
    // 2026-01-15 .. 2026-02-15 keeps only the Feb row.
    const res = await get('?startDate=2026-01-15T00:00:00Z&endDate=2026-02-15T00:00:00Z');

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.usage[0].toolName).toBe('sentiment_analysis');
  });

  it('never returns another user\'s usage rows', async () => {
    const res = await get();

    expect(res.status).toBe(200);
    const body = JSON.stringify(res.body);
    // Present in the DB, must never appear for this caller.
    expect(body).not.toContain('someone_elses_tool');
    expect(body).not.toContain(otherUserId);
  });

  it('does not echo ORM internals on the path that actually fails', async () => {
    // WHY NOT a bad date: `query('startDate').isISO8601()` is enforced by
    // `validateRequest` (Session 11), so `?startDate=not-a-date` is rejected
    // with a 400 BEFORE the handler runs and never touches Prisma. A test using
    // that input passes whether or not the leak exists — it asserted nothing.
    //
    // WHY NOT the unfiltered request either: once the column names are fixed the
    // query SUCCEEDS, the catch never runs, and there is nothing to leak. Mutation
    // A (restoring `error.message`) proved it — the suite stayed 6/6 green.
    //
    // So the failure is FORCED here: the Prisma call is made to reject with a
    // realistic validation error. That is the only construction in which the
    // leak assertions are load-bearing after the fix.
    const boom = Object.assign(
      new Error(
        "Invalid `prisma.aIUsageLog.findMany()` invocation: Unknown argument `createdAt`. " +
          'Available options are ... AIUsageLogOrderByWithRelationInput'
      ),
      { name: 'PrismaClientValidationError' }
    );
    const spy = jest.spyOn(prisma.aIUsageLog as any, 'findMany').mockRejectedValue(boom);

    try {
      const res = await get();

      // Pin the status FIRST: a leak test that also accepts 200 tests nothing.
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);

      const body = JSON.stringify(res.body);
      expect(body).not.toContain('PrismaClientValidationError');
      expect(body).not.toContain('Unknown argument');
      expect(body).not.toContain('AIUsageLogWhereInput');
      expect(body).not.toContain('OrderByWithRelationInput');
      expect(body).not.toContain('node_modules');
    } finally {
      spy.mockRestore();
    }
  });
});
