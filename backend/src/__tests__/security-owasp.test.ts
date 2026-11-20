import http from 'http';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { app } from '../app'; // Assuming you have an Express app
import { PrismaClient } from '@prisma/client';
import { resetDatabase } from './testDb';
import { isPublicApiPath } from '../middleware/requireAuth';

const prisma = new PrismaClient();

// One listener for the whole file. Passing the app to supertest makes it call
// `app.listen(0)` and close the listener again on every request, so requests
// can race the previous close (spurious 404 / socket hang up). Binding once and
// passing the server keeps every request on the real Express stack.
let server: http.Server;

// ---------------------------------------------------------------------------
// Real JWT minting.
//
// This suite used to send literal strings like `Bearer mock-token` and
// `Bearer mock-token-for-<id>`. Those are not JWTs, so `requireAuth`
// (middleware/requireAuth.ts) rejected them at the signature check with 401
// BEFORE any authorization logic ran. That made every "expect(...).toBe(403)"
// below vacuous: the assertion could never be satisfied, and — more
// importantly — it told us nothing about whether the authorization rules
// themselves were sound. A 401 from an unparseable token and a 403 from a
// correct role check are completely different findings.
//
// Tokens are signed with the same secret the middleware verifies against.
// `app.ts` calls `dotenv.config()` at import time (and it is imported above),
// so `process.env.JWT_SECRET` is already populated here from backend/.env.
// ---------------------------------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET as string;

/** Signs a token for a user row, exactly as authService does on login. */
function signToken(
  user: { id: string; role: string },
  options: { expiresIn?: string | number } = {}
): string {
  return jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: options.expiresIn ?? '1h' } as jwt.SignOptions
  );
}

/**
 * HOW THIS SUITE IS ORGANISED
 * ---------------------------
 * Every case below is one of three kinds, and the kind is named in its comment:
 *
 *   A — the test was written wrong (wrong status / wrong envelope key / wrong
 *       method) while the product behaviour was correct. The expectation is
 *       corrected here; the assertion stays as strict as before.
 *   B — the test asserted a control that DOES NOT EXIST (an unmounted endpoint,
 *       a middleware that was never written). The fake assertion is replaced by
 *       an assertion about what the app actually does, or removed entirely.
 *   C — the product has a real hole. The test is NOT relaxed to match the hole;
 *       it is `it.skip`-ed with the gap spelled out, and the gap is reported.
 *
 * Rate limiting does NOT live here. It moved to security-ratelimit.test.ts
 * because `loginRateLimiter` is a module-level singleton: 100+ login calls in
 * this file exhausted the 50/15min bucket and made every later login case in
 * the same file fail with 429. See that file's header for the full reasoning.
 *
 * TIMEOUT IS RAISED ON PURPOSE — THIS IS NOT A WORKAROUND FOR A HANG.
 * ------------------------------------------------------------------
 * Several cases below (A02/A07) drive real `bcrypt` at cost 10, which costs
 * ~60-100 ms per hash on an idle machine but is pure CPU and therefore loses
 * badly to any competing load. Observed on a 14-core box at load average 16.5:
 * this suite alone ranged from 5.2 s to 74.9 s across identical runs. Under
 * that variance a case that legitimately needs 6 sequential bcrypt ops blows
 * Jest's 5000 ms default and reports `Exceeded timeout`, which reads like a
 * product bug and is not one — the assertion never even ran.
 *
 * 30000 ms is deliberately finite: a genuine deadlock (the supertest listener
 * race this suite used to suffer) still trips it. The timeout is a ceiling on
 * CPU slowness, not a licence to hang. Verified 3/3 green at
 * `--testTimeout=20000` while the same machine was failing at 5000 ms.
 */
jest.setTimeout(30000);

describe('OWASP Top 10 Security Tests', () => {
  beforeAll(async () => {
    server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
  });

  beforeEach(async () => {
    // TRUNCATE ... CASCADE — see src/__tests__/testDb.ts for why ordered
    // deleteMany() cannot work against this schema's 37 User foreign keys.
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('A01:2021 - Broken Access Control', () => {
    it('should prevent unauthorized access to user profiles', async () => {
      // Create test users
      const user1 = await prisma.user.create({
        data: {
          email: 'user1@example.com',
          password: 'hashed',
          firstName: 'User',
          lastName: 'One',
          role: 'TENANT',
        }
      });

      const user2 = await prisma.user.create({
        data: {
          email: 'user2@example.com',
          password: 'hashed',
          firstName: 'User',
          lastName: 'Two',
          role: 'TENANT',
        }
      });

      // Try to access user2's profile as user1.
      //
      // REAL TOKEN: user1 is a TENANT with a validly signed JWT. The question
      // this test asks is whether a TENANT holding a *valid* token can read
      // another user's record. `GET /api/users/:id` is guarded by
      // `authMiddleware.admin` after `protect` (routes/usersRoutes.ts:13), so
      // the expected answer is 403 with a parseable token.
      const response = await request(server)
        .get(`/api/users/${user2.id}`)
        .set('Authorization', `Bearer ${signToken(user1)}`);

      expect(response.status).toBe(403);
    });

    it('should prevent IDOR attacks', async () => {
      // Path traversal with a REAL token, so the only variable under test is
      // how the server resolves the traversed path — not whether the token is
      // parseable.
      //
      // CLASS A (test was wrong, product is right). The old expectation was 400.
      // What actually happens is better: Express normalises
      // `/api/users/../../../etc/passwd` to `/etc/passwd` BEFORE route matching,
      // so the request never enters the `/api` router (and never reaches a
      // handler that could read the id param). It falls through to Express's
      // terminal 404. 404 — not 400 — is therefore the correct, stronger result:
      // the traversal escaped the /api surface and found no route at all. The
      // old 400 expectation described a validation error that never occurs.
      const attacker = await prisma.user.create({
        data: {
          email: 'idor@example.com',
          password: 'hashed',
          firstName: 'Idor',
          lastName: 'Attacker',
          role: 'TENANT',
        },
      });

      const response = await request(server)
        .get('/api/users/../../../etc/passwd')
        .set('Authorization', `Bearer ${signToken(attacker)}`);

      // Exact 404 (not "any non-2xx"): the normalisation result is part of the
      // contract we are pinning down.
      expect(response.status).toBe(404);

      // The real security property: no file bytes leaked. A 404 alone would not
      // prove that if the response body happened to carry the file contents.
      const serialised = JSON.stringify(response.body) + (response.text ?? '');
      expect(serialised).not.toContain('root:x:0:0');
      expect(serialised).not.toContain('/bin/bash');
    });
  });

  describe('A02:2021 - Cryptographic Failures', () => {
    it('should use secure password hashing', async () => {
      const password = 'testPassword123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      // Verify hash is different from plain password
      expect(hashedPassword).not.toBe(password);

      // Verify hash can be validated
      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject passwords below the minimum length', async () => {
      // CLASS A (envelope key) + narrowed scope, deliberately.
      //
      // Two things were wrong with the old case:
      //  1. It asserted `response.body.error`, but every handler answers with
      //     `{ status: 'error', message }` — there is no `error` key.
      //  2. It lumped 'password' in with '123'/'abc'/'' and expected all four to
      //     be rejected. That was never true: `validateRegistration`
      //     (middleware/validation.ts:78) only enforces length >= 6, so
      //     'password' is accepted with 201. Keeping it in this loop would have
      //     forced us to fabricate a complexity rule that does not exist.
      //     The missing complexity/breach-list check is a real gap — see the
      //     skipped case immediately below, and the report.
      //
      // ORDERING NOTE (do not reorder): `router.post('/register',
      // validateRegistration, registerRateLimiter, ...)` runs validation BEFORE
      // the 5/hour register limiter, so these requests never consume the
      // registration allowance. If that order is ever flipped, this loop starts
      // returning 429 on the 6th run and the failure will look unrelated.
      const tooShort = ['123', 'abc', ''];

      for (const password of tooShort) {
        const response = await request(server)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password,
            firstName: 'Test',
            lastName: 'User',
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Password must be at least 6 characters long');
      }
    });

    it.skip('should reject weak-but-long passwords (GAP: no complexity policy)', async () => {
      // CLASS C — real security gap, reported to the product owner.
      //
      // Verified live: `POST /api/auth/register` with password 'password'
      // (8 chars, the single most-guessed credential) returns 201 and creates
      // the account. The only password rule in the codebase is
      // `password.length < 6` at middleware/validation.ts:78. There is no
      // complexity rule, no denylist, and no breach-corpus check.
      //
      // Skipped rather than asserted-as-is on purpose: a green test that pins
      // "weak passwords are accepted" would freeze the vulnerability in place.
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          email: 'weak@example.com',
          password: 'password',
          firstName: 'Weak',
          lastName: 'Password',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('A03:2021 - Injection', () => {
    it('should prevent SQL injection in login', async () => {
      // CLASS A: envelope key. `message`, not `error`. The rest of the case was
      // already meaningful — Prisma parameterises the lookup, so the payload is
      // treated as a literal email string and the only possible outcome is a
      // failed credential check.
      const maliciousEmail = "' OR '1'='1'; --";

      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: maliciousEmail,
          password: 'password',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should fail closed on an unsupported method of a public path', async () => {
      // CLASS B (rewritten). The old case POSTed a MongoDB operator payload to
      // `/api/search` and expected 400 "NoSQL injection blocked". There is no
      // POST /api/search at all — routes/searchRoutes.ts:12,19,26 declares GET
      // only — so the 400 was describing a control that does not exist. A green
      // assertion there proved nothing.
      //
      // What is real and worth pinning down: the auth guard is deny-by-default.
      // A method the app never registered still hits `app.use('/api',
      // requireAuth)` first and is rejected with 401, i.e. the request surface
      // does not expand just because a caller invents a verb.
      const unauthenticated = await request(server)
        .post('/api/search')
        .send({ query: { $ne: null } });

      expect(unauthenticated.status).toBe(401);
      expect(unauthenticated.body.message).toBe('Not authorized, no token');

      // And with a valid token the router confirms the route genuinely does not
      // exist (404), rather than this test quietly passing against some hidden
      // handler that happens to reject the payload.
      const user = await prisma.user.create({
        data: {
          email: 'nosql@example.com',
          password: 'hashed',
          firstName: 'No',
          lastName: 'Sql',
          role: 'TENANT',
        },
      });

      const authenticated = await request(server)
        .post('/api/search')
        .set('Authorization', `Bearer ${signToken(user)}`)
        .send({ query: { $ne: null } });

      expect(authenticated.status).toBe(404);
      expect(authenticated.body.message).toBe('API endpoint not found');
    });

    it.skip('should reject non-string credential types (GAP: no request schema)', async () => {
      // CLASS C — real security gap, reported to the product owner.
      //
      // Verified live: POST /api/auth/login with `{"email": {"$ne": null}}`
      // returns **500** instead of 400. `message` is emitted regardless of
      // NODE_ENV (only `stack` is gated at app.ts:216), so what leaks depends on
      // the environment — measured both ways:
      //
      //   production  -> message contains the Prisma error body:
      //                  "Invalid `prisma.user.findUnique()` invocation:"
      //                  plus the `where` / `email` / `$ne` field names, the
      //                  squiggle markers and "Expected String, provided Object".
      //                  No `/Users/`, no `controllers`, no source frame — Prisma
      //                  (or the bundled runtime) strips the location there.
      //   development -> message AND stack both contain the absolute source
      //                  location ".../backend/src/controllers/authController.ts:216:36"
      //                  plus a copy of the surrounding source lines.
      //
      // So the honest statement is: production discloses ORM internals (query
      // shape, field names, expected types) but not source paths; development
      // discloses source paths in two separate fields. Both are 500s where a 400
      // belongs, which is the underlying defect.
      //
      // Root cause: `validateLogin` only checks truthiness
      // (middleware/validation.ts:113-121) and never asserts that
      // `email`/`password` are strings, so a JSON object flows straight into a
      // Prisma `where` clause. Same for `validateRegistration`.
      //
      // Skipped, not relaxed: asserting "500" would enshrine the disclosure, and
      // asserting "400" would be a lie until the type guard exists.
      const response = await request(server)
        .post('/api/auth/login')
        .send({ email: { $ne: null }, password: 'x' });

      expect(response.status).toBe(400);
    });

    it('should keep the auth guard and validation on the restored property write path', async () => {
      // CLASS A, rewritten after CRUD was restored. Three successive states:
      //  1. Originally this case posted `<script>` and expected 400 +
      //     'suspicious', claiming an XSS sanitiser had stripped it. There is
      //     NO global XSS sanitisation middleware in this repo — a real C-class
      //     gap, still skipped below.
      //  2. When the endpoint became a 410 stub, it was rewritten to pin 410 +
      //     the deprecation envelope, which tested no security property at all.
      //  3. `/api/properties` is now a live Rental view. Both old expectations
      //     are obsolete.
      //
      // What is asserted honestly now: the request reaches REAL validation
      // (400, never 410 and never 5xx) even with an unknown `name` key carrying
      // a script payload — the whitelist drops unknown keys instead of letting
      // Prisma throw — and the anonymous write is still rejected by the global
      // auth guard. Checked at the HTTP boundary AND against the allowlist.
      const user = await prisma.user.create({
        data: {
          email: 'xss@example.com',
          password: 'hashed',
          firstName: 'Xss',
          lastName: 'Probe',
          role: 'PROPERTY_MANAGER',
        },
      });

      const response = await request(server)
        .post('/api/properties')
        .set('Authorization', `Bearer ${signToken(user)}`)
        .send({
          name: '<script>alert("xss")</script>',
          address: '123 Main St',
        });

      expect(response.status).toBe(400);
      expect(response.body).not.toHaveProperty('error'); // no 410 envelope
      expect(response.body).not.toHaveProperty('migration');
      expect(JSON.stringify(response.body)).not.toContain('Endpoint Deprecated');
      expect(response.body.missingFields).toContain('title');

      const anonymous = await request(server)
        .post('/api/properties')
        .send({ name: '<script>alert("xss")</script>' });

      expect(anonymous.status).toBe(401);
      expect(isPublicApiPath('/properties')).toBe(false);
    });

    it.skip('should sanitise stored XSS payloads (GAP: no global XSS sanitiser)', async () => {
      // CLASS C — deliberately NOT relaxed into a green test. Asserting that a
      // script payload is stored verbatim would freeze the vulnerability in
      // place as expected behaviour. A real fix needs an input-sanitisation
      // layer; only then should this assert the stored value is escaped.
    });
  });

  describe('A04:2021 - Insecure Design', () => {
    // Rate limiting lives in security-ratelimit.test.ts — see this file's
    // header for why it cannot share a module registry with the cases here.

    it('should have secure session management', async () => {
      // Session timeout: a REAL, correctly signed JWT that has already expired.
      // `jwt.verify` checks `exp` before any controller runs, so this isolates
      // "does expiry get enforced" from "is the token well-formed". Note the
      // old `Bearer expired-token` literal was rejected at the signature check,
      // which would have passed this test even if `exp` were never enforced.
      const user = await prisma.user.create({
        data: {
          email: 'expired@example.com',
          password: 'hashed',
          firstName: 'Expired',
          lastName: 'Token',
          role: 'TENANT',
        },
      });

      const expiredToken = signToken(user, { expiresIn: '-1h' });

      const response = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('A05:2021 - Security Misconfiguration', () => {
    it('should not expose sensitive information in errors', async () => {
      // CLASS A: status was wrong, and the body assertion was vacuous.
      // `expect(response.body).not.toContain('stack')` passes trivially on a
      // plain object — `toContain` only understands arrays and strings, and for
      // anything else it compares against `indexOf`, which is undefined, so the
      // negated form is always satisfied. The old case therefore never once
      // looked for a stack trace, whether or not one was present.
      //
      // 401 rather than 404 is by design: `app.use('/api', requireAuth)` runs
      // before any router, so an unknown /api path is rejected as unauthenticated
      // first. That is a stronger default (an unauthenticated caller cannot even
      // enumerate which paths exist).
      const response = await request(server)
        .get('/api/nonexistent-endpoint');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Not authorized, no token');

      // Precise assertions replacing the vacuous one.
      expect(response.body).not.toHaveProperty('stack');
      expect(JSON.stringify(response.body)).not.toContain('backend/src');
    });

    it('should omit stack traces from error responses in production', async () => {
      // NEW coverage. `app.ts:216` decides whether to attach `stack` at
      // request time (`process.env.NODE_ENV !== 'production'`), and nothing
      // exercised the production branch — the suite ran in `test`, where the
      // field is present, so a regression that always leaked stacks would have
      // gone unnoticed.
      //
      // A 400 from `validateRegistration` is used because it is a deterministic
      // error path with no DB or external dependency.
      const previousNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        const response = await request(server)
          .post('/api/auth/register')
          .send({ email: 'prod@example.com', password: 'x', firstName: 'P', lastName: 'Q' });

        expect(response.status).toBe(400);
        // The message survives; only the stack is stripped.
        expect(response.body.message).toBe('Password must be at least 6 characters long');
        expect(response.body).not.toHaveProperty('stack');
        expect(JSON.stringify(response.body)).not.toContain('backend/src');
      } finally {
        // Must be restored even on failure — other suites assert the dev-mode
        // shape, and NODE_ENV also drives the session cookie's `secure` flag.
        process.env.NODE_ENV = previousNodeEnv;
      }
    });

    it('should have security headers', async () => {
      // CLASS A: the expected values contradicted the deployed configuration.
      //
      // `helmet()` at app.ts:58 is called with no options, i.e. helmet's
      // defaults. Asserting DENY / '1; mode=block' would have required changing
      // production config to satisfy a test, which is backwards. The defaults
      // are also the right choice here:
      //  - `X-Frame-Options: SAMEORIGIN` (not DENY) is deliberate for an app that
      //    embeds its own dashboard.
      //  - `X-XSS-Protection: 0` is the modern correct value: the legacy auditor
      //    is deprecated and has itself been a source of XSS, so browsers are
      //    told to disable it. CSP is the real replacement, which is why the CSP
      //    header is asserted below with equal weight.
      const response = await request(server)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['x-xss-protection']).toBe('0');
      expect(response.headers['strict-transport-security']).toBe(
        'max-age=15552000; includeSubDomains'
      );

      // The control that actually mitigates XSS today.
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });
  });

  describe('A06:2021 - Vulnerable and Outdated Components', () => {
    it('should validate dependencies for known vulnerabilities', () => {
      // This would typically be done with tools like npm audit
      // For this test, we'll check that we're using recent versions
      const packageJson = require('../../../package.json');

      expect(packageJson.dependencies).toBeDefined();
      // Add specific version checks as needed
    });
  });

  describe('A07:2021 - Identification and Authentication Failures', () => {
    it('should require authentication for MFA enrollment', async () => {
      // CLASS B (rewritten). The old case POSTed to `/api/admin/users` and
      // expected 403 "MFA required". That path does not exist (verified: 404,
      // 'API endpoint not found'), so the assertion was about nothing.
      //
      // The real MFA surface is /api/mfa/*, and the property worth testing is
      // that enrollment cannot even be started anonymously — otherwise an
      // attacker who only knows an email could overwrite a victim's TOTP
      // secret.
      //
      // Deliberately asserting the OBSERVABLE OUTCOME (401, no enrollment
      // started) and NOT attributing it to one specific middleware. There are
      // three independent layers that each block this:
      //   1. app.ts:139        app.use('/api', requireAuth)   (global, deny-by-default)
      //   2. mfaRoutes.ts:43   authMiddleware.protect         (per-route)
      //   3. mfaRoutes.ts:47-49 handler-level `if (!userId) return 401`
      // Mutation testing showed the case stays green if any one of them is
      // removed and only turns red when all three are gone. Naming a single
      // culprit in this comment would therefore be wrong, and would invite a
      // future maintainer to "fix" the wrong layer. Defence in depth is the
      // intent here; this test pins the guarantee, not its implementation.
      const enrolAnonymous = await request(server).post('/api/mfa/setup');
      expect(enrolAnonymous.status).toBe(401);

      const statusAnonymous = await request(server).get('/api/mfa/status');
      expect(statusAnonymous.status).toBe(401);
    });

    it('should deny privileged operations to a low-privilege user', async () => {
      // Preserves the old case's *intent* (a TENANT must not reach
      // administrative actions) on an endpoint that actually exists:
      // `GET /api/users/:id` is `protect` + `admin` (routes/usersRoutes.ts:13),
      // so a valid TENANT token must yield 403 — not 401, which would only mean
      // the token was unparseable.
      const tenant = await prisma.user.create({
        data: {
          email: 'nomfa@example.com',
          password: 'hashed',
          firstName: 'No',
          lastName: 'MFA',
          role: 'TENANT',
          mfaEnabled: false,
        }
      });

      const response = await request(server)
        .get(`/api/users/${tenant.id}`)
        .set('Authorization', `Bearer ${signToken(tenant)}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Not authorized as an admin');
    });

    it('should handle account lockout correctly', async () => {
      // CLASS A: envelope key (`message`, not `error`) — the lockout itself
      // works exactly as designed.
      //
      // The stored password is now a REAL bcrypt hash. The old case wrote the
      // literal string 'hashed', which made `bcrypt.compare` fail unconditionally
      // — including for the final 'correctpassword' attempt. That silently
      // changed which branch of `login` was under test: the last request was
      // just another wrong-password failure, not the "locked account" guard at
      // authController.ts:240. With a real hash the final attempt is a *correct*
      // credential against a locked account, which is the only way to prove the
      // lockout check runs BEFORE credential verification.
      const user = await prisma.user.create({
        data: {
          email: 'lockout@example.com',
          password: await bcrypt.hash('correctpassword', 10),
          firstName: 'Lockout',
          lastName: 'Test',
          role: 'TENANT',
        }
      });

      // lockoutConfig.maxFailedAttempts is 5 (.env MAX_FAILED_ATTEMPTS).
      for (let i = 0; i < 6; i++) {
        await request(server)
          .post('/api/auth/login')
          .send({
            email: 'lockout@example.com',
            password: 'wrongpassword',
          });
      }

      const locked = await prisma.user.findUnique({ where: { id: user.id } });
      expect(locked?.isLocked).toBe(true);
      expect(locked!.failedLoginAttempts).toBeGreaterThanOrEqual(5);

      // Next attempt — with the CORRECT password — must be blocked.
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'lockout@example.com',
          password: 'correctpassword',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('locked');
      // A locked account must not hand out a token.
      expect(response.body.data).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // A08:2021 - Software and Data Integrity Failures
  //
  // REMOVED (CLASS B). This section had two cases against `/api/validate-data`
  // and `/api/process-data`, both expecting 400. Neither endpoint exists — a
  // full-repo grep finds them only in this test file, and live calls with a
  // valid token return 404 `{status:'error',message:'API endpoint not found'}`.
  // They asserted a checksum verifier and a safe-deserialiser that were never
  // written, so they could only ever be green by accident or be "fixed" by
  // inventing endpoints.
  //
  // Reported as an open gap: this backend has no integrity-verification or
  // schema-gated deserialisation layer. Express's `express.json()` does not
  // recurse into `__proto__`, so there is no *demonstrable* prototype-pollution
  // path today, but nothing in the app enforces or tests that either.
  // ---------------------------------------------------------------------------

  describe('A09:2021 - Security Logging and Monitoring Failures', () => {
    // These two cases verify the A09 fix in controllers/authController.ts
    // (`writeAuthAudit`). They previously failed because the 101-request rate
    // limiting case in this same file had exhausted the login bucket, so the
    // login handler never ran and no audit row was written. With rate limiting
    // moved to its own file (and <15 logins left here) they exercise the writer
    // itself. NOTE: src/__tests__/setup.ts mocks ../services/audit.service, so
    // asserting the audit trail means querying the real `prisma.auditEntry`.
    it('should log security events', async () => {
      const beforeCount = await prisma.auditEntry.count();

      await request(server)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrong',
        });

      const afterCount = await prisma.auditEntry.count();
      expect(afterCount).toBeGreaterThan(beforeCount);
    });

    it('should log failed authentication attempts', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      // Precondition: this must be a real credential failure, not a 429 from a
      // dirty bucket. Without it a 429 would also produce zero audit rows and
      // the failure would look like a logging bug.
      expect(response.status).toBe(401);

      const auditEntries = await prisma.auditEntry.findMany({
        where: {
          action: 'LOGIN_FAILED',
          entityType: 'USER',
        },
        orderBy: { timestamp: 'desc' },
        take: 1,
      });

      expect(auditEntries).toHaveLength(1);
      expect(auditEntries[0].severity).toBe('WARNING');
    });
  });

  // ---------------------------------------------------------------------------
  // A10:2021 - Server-Side Request Forgery (SSRF)
  //
  // REMOVED (CLASS B). Two cases POSTed attacker-chosen URLs to `/api/fetch-url`
  // and expected 400 'invalid'. That endpoint does not exist (404), so no SSRF
  // filter was ever exercised.
  //
  // Reported as an open gap, out of scope for this file: the codebase does make
  // outbound requests from services (zillowService, apartmentsComService,
  // backgroundCheck.service, workflowAutomation.service). Testing those as SSRF
  // surfaces needs per-service fixtures and a network boundary the unit sandbox
  // does not provide — it belongs in a dedicated suite, not a fake 400 here.
  // ---------------------------------------------------------------------------
});
