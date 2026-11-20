import http from 'http';
import request from 'supertest';
import { app } from '../app';
import { PrismaClient } from '@prisma/client';
import { resetDatabase } from './testDb';

const prisma = new PrismaClient();

/**
 * ONE SERVER FOR THE WHOLE FILE — not `request(app)` per call.
 *
 * This file fires ~70 sequential requests (51 to exhaust the login bucket, plus
 * the register block). `request(app)` does not reuse a listener: supertest's
 * `serverAddress` does `if (!addr) this._server = app.listen(0)` and its `.end()`
 * closes that ephemeral server again, once per request. Measured over 612
 * requests, that churn produced ~1 failure per 300 calls — a `socket hang up` or
 * a spurious 404 from a request racing the close of the previous listener.
 * Those are transport faults, not throttle behaviour, and they made this suite
 * fail intermittently for reasons that had nothing to do with the assertions.
 *
 * Binding once and passing the server to supertest removes the race: the same
 * 612 requests through a shared listener had zero failures. This does NOT
 * weaken any assertion — every request still traverses the real Express stack
 * and the real rate-limit middleware; only the socket lifecycle changes.
 */
let server: http.Server;

beforeAll(async () => {
  server = await new Promise<http.Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

/**
 * RATE LIMITING — WHY THIS IS A SEPARATE FILE
 * -------------------------------------------
 * `loginRateLimiter` / `registerRateLimiter` (middleware/rateLimiter.ts) are
 * built with `express-rate-limit`, whose default store is a **module-level
 * in-memory singleton**. The counter lives for the lifetime of the loaded
 * module, not for the lifetime of a test.
 *
 * That has a concrete consequence: when the rate-limiting case sat inside
 * security-owasp.test.ts and fired 101 logins to prove "at least one 429", it
 * drained the shared 50/15min bucket. Every later login in that file — A07
 * lockout, A09 failed-login auditing — then received 429 instead of 401. Those
 * cases reported as "A09 auditing is broken" when in fact the handler had never
 * been reached. Two real failures were being masked by one unrelated one.
 *
 * It cannot be fixed with `beforeEach`: the store offers `resetKey`/`resetAll`
 * only via the limiter instance, and reaching into it from a test couples the
 * test to library internals. Jest, however, gives each **test file** its own
 * module registry (a fresh `require` graph, and therefore a fresh store) even
 * under `--runInBand`. Putting the limiter cases in their own file gives them a
 * clean bucket by construction, and leaves the security suite's bucket untouched
 * because it now issues well under 50 logins.
 *
 * ORDERING IS LOAD-BEARING IN THIS FILE. Cases share one bucket, so they run in
 * a sequence where the first case reads headers from a near-empty bucket and the
 * last case does the exhausting. Adding a case that logs in must account for the
 * requests the earlier cases already spent; the arithmetic is spelled out below.
 *
 * TIMEOUT IS RAISED ON PURPOSE — THIS IS NOT A WORKAROUND FOR A HANG.
 * ------------------------------------------------------------------
 * The register-quota case performs 6 real registrations, and `authController`
 * runs `bcrypt.genSalt(10)` on each success (authController.ts:88,141). That is
 * ~60-100 ms of pure CPU per hash when idle, so the case is entirely at the
 * mercy of machine load: on a 14-core box at load average 16.5 this suite
 * ranged from 3 s to 54 s across identical runs, and at the 5000 ms default it
 * intermittently reported `Exceeded timeout` before any assertion executed.
 * (The flake also surfaced in security-owasp's A07 lockout case in the same
 * run, which is how it was correctly diagnosed as load, not logic.)
 *
 * 30000 ms is deliberately finite: a real deadlock still trips it.
 */
jest.setTimeout(30000);

describe('Rate limiting (isolated store)', () => {
  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  it('should advertise its quota via standard RateLimit headers', async () => {
    // The app uses `standardHeaders: true`, which express-rate-limit v8 resolves
    // to IETF draft-6: RateLimit-Policy / -Limit / -Remaining / -Reset. (These
    // are the `draft-ietf-httpapi-ratelimit-headers` fields — not RFC 9449,
    // which is OAuth DPoP and has nothing to do with throttling.) Asserting the
    // headers rather than only the eventual 429 is what makes the quota
    // *introspectable*: a client can back off before being blocked.
    const first = await request(server)
      .post('/api/auth/login')
      .send({ email: 'rl-probe@example.com', password: 'wrongpassword' });

    expect(first.status).toBe(401);

    // `ratelimit-policy` encodes both dimensions: <limit>;w=<window seconds>.
    expect(first.headers['ratelimit-policy']).toBe('50;w=900');
    expect(first.headers['ratelimit-limit']).toBe('50');
    expect(first.headers['ratelimit-remaining']).toBeDefined();
    expect(first.headers['ratelimit-reset']).toBeDefined();

    const firstRemaining = Number(first.headers['ratelimit-remaining']);
    expect(Number.isNaN(firstRemaining)).toBe(false);
    // 50-bucket, one request spent. Asserting the exact value pins "the first
    // request is not silently pre-decremented or double-counted".
    expect(firstRemaining).toBe(49);

    // Second request must decrement by exactly one.
    const second = await request(server)
      .post('/api/auth/login')
      .send({ email: 'rl-probe@example.com', password: 'wrongpassword' });

    expect(second.status).toBe(401);
    expect(Number(second.headers['ratelimit-remaining'])).toBe(48);
  });

  it('should block with 429 once the quota is exhausted, and stop calling the handler', async () => {
    // Requests already spent by the previous case in this file.
    const alreadySpent = 2;
    const quota = 50;

    // Use a non-existent email: `login` returns 401 from the USER_NOT_FOUND
    // branch without a bcrypt compare, so filling the bucket is cheap, and each
    // attempt is auditable — which is how we prove the handler stopped running.
    const email = 'rl-exhaust@example.com';

    let limited: request.Response | null = null;
    let sent = alreadySpent;

    for (let i = 0; i < quota - alreadySpent + 5; i++) {
      const response = await request(server)
        .post('/api/auth/login')
        .send({ email, password: 'wrongpassword' });
      sent++;

      if (response.status === 429) {
        limited = response;
        break;
      }
      // Every request before the limit must be a real credential failure.
      expect(response.status).toBe(401);
    }

    expect(limited).not.toBeNull();
    // The 51st request overall is the first to be rejected (50 allowed).
    expect(sent).toBe(quota + 1);

    // Shape of the rejection: the limiter is the one configured for /login, and
    // it tells the client when to come back.
    //
    // RANGE, not equality, on purpose. `Retry-After` is a *relative* countdown
    // from the bucket's window start, and the window start is anchored at this
    // key's very first request (MemoryStore.getClient -> resetClient sets
    // `resetTime = now + windowMs` on first sight of the key). So the value is
    // `ceil((t0 + 900_000 - now) / 1000)` and it shrinks by however long this
    // test took. Exhausting the bucket means ~50 sequential supertest requests,
    // each with a DB round-trip plus an audit insert; at 0.5s total the header
    // reads 900, at 1.5s it reads 899, and on a cold cache or a loaded machine
    // it will legitimately be lower still. Pinning `toBe('900')` made this line
    // fail roughly 1 run in 4 despite nothing being wrong.
    //
    // Bounds:
    //  - 900 is the configured window (`windowMs: 15 * 60 * 1000`), the hard
    //    upper bound; a larger value would mean the anchor or window is wrong.
    //  - 880 leaves 20s of slack, i.e. it tolerates ~390ms per request across
    //    all 51. That is generous for a local Postgres but still fails loudly if
    //    the limiter ever starts returning a materially shorter (or negative)
    //    countdown — a window misconfiguration or a second, undiscovered bucket.
    //    It is not "any positive number", which would accept a broken window.
    const retryAfter = Number(limited!.headers['retry-after']);
    expect(retryAfter).toBeGreaterThan(880);
    expect(retryAfter).toBeLessThanOrEqual(900);
    expect(limited!.headers['ratelimit-remaining']).toBe('0');
    expect(limited!.text).toContain('Too many login attempts');

    // THE POINT OF THE TEST: throttling must happen *before* the login handler,
    // not after it. If the limiter were misplaced (after `validateLogin`, or
    // inside the controller) the attacker would still get a bcrypt compare and
    // an audit write for every attempt — the throttle would slow nothing. We
    // measure that by freezing the audit table at the moment of the 429.
    const auditAtLimit = await prisma.auditEntry.count();
    expect(auditAtLimit).toBeGreaterThan(0);

    const afterLimit = await request(server)
      .post('/api/auth/login')
      .send({ email, password: 'wrongpassword' });

    expect(afterLimit.status).toBe(429);
    expect(await prisma.auditEntry.count()).toBe(auditAtLimit);
  });

  it('should enforce the tighter register quota and not spend it on validation rejects', async () => {
    // `registerRateLimiter` is 5/hour (middleware/rateLimiter.ts:32-38), 10x
    // tighter than login because each registration costs a bcrypt hash and a row
    // insert. `router.post('/register', validateRegistration,
    // registerRateLimiter, ...)` deliberately puts validation FIRST, so a
    // malformed body is rejected before the (expensive) allowance is touched.
    // That ordering is a real design decision, and this is the only place it is
    // verified — if the two middleware are ever swapped, an attacker can burn a
    // legitimate user's quota with 6 junk requests.
    for (let i = 0; i < 6; i++) {
      const rejected = await request(server)
        .post('/api/auth/register')
        .send({ email: 'rl-register@example.com', password: 'x', firstName: 'A', lastName: 'B' });

      // Still 400, never 429 — six cheap rejects cost nothing.
      expect(rejected.status).toBe(400);
      // Proof that the register limiter never ran: its 5-request policy would
      // have overwritten this header. What we see instead is the global
      // 100/15min limiter mounted at routes/index.ts:65, which every /api
      // request passes through. Getting 100 here and 5 on the valid requests
      // below is exactly the ordering the route declares.
      expect(rejected.headers['ratelimit-limit']).toBe('100');
    }

    // Now spend the real allowance: 5 valid registrations succeed.
    for (let i = 0; i < 5; i++) {
      const created = await request(server)
        .post('/api/auth/register')
        .send({
          email: `rl-register-${i}@example.com`,
          password: 'password123',
          firstName: 'Rl',
          lastName: 'Register',
        });

      expect(created.status).toBe(201);
      // The register limiter's own policy replaces the global one on responses
      // it actually processed — direct evidence this request reached it.
      expect(created.headers['ratelimit-policy']).toBe('5;w=3600');
      expect(Number(created.headers['ratelimit-remaining'])).toBe(4 - i);
    }

    // The sixth is throttled.
    const throttled = await request(server)
      .post('/api/auth/register')
      .send({
        email: 'rl-register-6@example.com',
        password: 'password123',
        firstName: 'Rl',
        lastName: 'Register',
      });

    expect(throttled.status).toBe(429);
    expect(throttled.text).toContain('Too many registration attempts');

    // ...and the throttled signup created no account.
    expect(await prisma.user.findUnique({ where: { email: 'rl-register-6@example.com' } })).toBeNull();
  });
});
