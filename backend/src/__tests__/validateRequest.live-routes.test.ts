// @ts-nocheck
/**
 * END-TO-END proof that the `express-validator` chains mounted on the live
 * routers are actually ENFORCED.
 *
 * WHY THIS FILE EXISTS ON TOP OF `validateRequest.middleware.test.ts`
 * -----------------------------------------------------------------
 * The unit test pins the middleware's contract. It cannot prove the wiring: a
 * route that drops `validateRequest` from its middleware array, or reorders it
 * BEFORE the chains (so it reads results that have not been recorded yet),
 * would leave the unit test green while the endpoint accepted anything.
 *
 * That reordering is not hypothetical — it is the exact mistake available at
 * all 25 call sites, because `validateRequest` is a plain sibling in an array.
 *
 * WHAT WAS BROKEN
 * ---------------
 * `express-validator` never rejects anything by itself. Its `body()`/`param()`/
 * `query()` chains only RECORD failures on the request; `validationResult(req)`
 * is the only thing that reads them, and nothing in `src/` called it. So
 * `router.post('/generate', [... body('text').isString().notEmpty(), validateRequest], h)`
 * validated nothing at all: a request with no `text`, or `text` as an object,
 * was passed straight into a BILLED AI vendor call.
 *
 * The endpoints are asserted through the real Express app, so this file fails if
 * the chains stop being enforced anywhere in the chain.
 *
 * WHY A 400 AND NOT A 500
 * -----------------------
 * The pre-fix behaviour for a missing `text` was a 500 with
 * `error.message` echoed to the client (`TypeError: ... reading 'length'`).
 * 400 is the correct classification: the CALLER's input was invalid, and the
 * billed vendor must never be reached.
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { prisma } from '../config/database';
import { resetDatabase } from './testDb';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

/** A real user row so `authenticateToken` can re-hydrate it. */
let userId: string;
let token: string;

beforeAll(async () => {
  await resetDatabase(prisma);
  const user = await prisma.user.create({
    data: {
      email: 'validator-live@example.com',
      password: 'hashed-not-used',
      firstName: 'Validator',
      lastName: 'Live',
      role: 'ADMIN',
    },
  });
  userId = user.id;
  token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('/api/ai — validator chains are enforced, not decoration', () => {
  it('POST /api/ai/generate rejects a missing `text` with 400, not 500', async () => {
    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('status', 'error');
    // The pre-fix bug: a 500 with a raw TypeError message.
    expect(res.body.message).not.toMatch(/Cannot read|undefined is not|TypeError/);
  });

  it('POST /api/ai/generate rejects a non-string `text`', async () => {
    // The billed-vendor risk: a truthy non-string used to sail through, because
    // `body('text').isString()` was recorded and then discarded.
    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: { $ne: null } });

    expect(res.status).toBe(400);
  });

  it('POST /api/ai/generate rejects an out-of-range `maxLength`', async () => {
    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'hello', maxLength: 999999 });

    expect(res.status).toBe(400);
  });

  it('POST /api/ai/classify rejects a non-array `labels`', async () => {
    const res = await request(app)
      .post('/api/ai/classify')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'hi', labels: 'not-an-array' });

    expect(res.status).toBe(400);
  });

  it('POST /api/ai/classify rejects an array with a non-string element', async () => {
    const res = await request(app)
      .post('/api/ai/classify')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'hi', labels: ['ok', 42] });

    expect(res.status).toBe(400);
  });

  it('a 400 does not echo a stack trace or an ORM detail', async () => {
    const res = await request(app)
      .post('/api/ai/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    // Pin the status too: without it this test also passes on the pre-fix 500,
    // which is the opposite of what it is meant to assert.
    expect(res.status).toBe(400);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('stack');
    expect(body).not.toContain('prisma');
    expect(body).not.toContain('node_modules');
  });
});

describe('/api/alert-groups — param() and body() chains are enforced', () => {
  it('POST / rejects an invalid `groupType` enum value', async () => {
    const res = await request(app)
      .post('/api/alert-groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        groupType: 'NOT_A_REAL_TYPE',
        priority: 'HIGH',
        propertyId: 'p1',
      });

    expect(res.status).toBe(400);
    expect(res.body.errors?.[0]).toHaveProperty('field', 'groupType');
  });

  it('POST / rejects a missing required `propertyId`', async () => {
    const res = await request(app)
      .post('/api/alert-groups')
      .set('Authorization', `Bearer ${token}`)
      .send({ groupType: 'MAINTENANCE', priority: 'HIGH' });

    expect(res.status).toBe(400);
  });
});
