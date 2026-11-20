// @ts-nocheck
/**
 * `enhancedAuthService` — performance characteristics of a login flow that is
 * NOT MOUNTED, plus the one real defect it contains.
 *
 * ============================ READ THIS FIRST ============================
 * `enhancedAuthService` is an alternate login implementation. It is NOT routed:
 *   - `/api/auth/login` is handled by `controllers/authController.login`
 *     (`routes/authRoutes.ts:14`), which does not import this service.
 *   - No biometric route and no SSO route is mounted (`app.ts` /
 *     `routes/index.ts` contain no such mount).
 *   - `authController.ts:22` already records this: "`enhancedAuthService`
 *     implements a *different*, unrouted login flow".
 * So the tests below measure a service that is currently dead in production.
 * They are kept because the service is imported by `ssoService.ts`, which is
 * itself unrouted but not deleted -- and because one of the behaviours here is
 * a genuine defect (see the last describe block).
 * =========================================================================
 *
 * WHY THIS FILE WAS REWRITTEN
 * ---------------------------
 * Three defects made this suite structurally unable to report the truth:
 *
 * 1. `beforeAll` hashed the password 100 times at cost 10. Measured at 61 ms per
 *    hash on this machine, that is ~6.1 s of CPU-bound work against Jest's
 *    5000 ms default hook timeout, so the hook ALWAYS threw. Every one of the 7
 *    tests then failed *before its body ran* -- 7 red results that were not
 *    verdicts. It also made the full-suite failed count swing by ~25 depending
 *    on machine load (S19: 84 vs 109 on identical code).
 *
 *    Fix: hash ONCE and reuse the digest. Every user gets a valid cost-10 hash
 *    of "password123"; salts differ per hash but nothing compares hashes to one
 *    another, so this is behaviourally identical and costs 59 ms instead of
 *    6,100 ms.
 *
 * 2. `jest.spyOn(require('../mfaService'), 'verifyTOTP')` used the wrong path.
 *    From `src/__tests__/` that resolves to `src/mfaService`, which does not
 *    exist -- the real module is `src/services/mfaService.ts`. Jest threw
 *    `Cannot find module`, so the mock never installed and
 *    `mockReturnValue(true)` never applied: the MFA test was secretly asserting
 *    against the REAL TOTP verifier with a hardcoded code, and reporting a
 *    module-resolution error as a product failure.
 *
 * 3. `afterAll` called `prisma.user.deleteMany({ email: /^perf-test-/ })`, which
 *    violates `Session_userId_fkey` because `authenticate()` created sessions
 *    for those users. This is the recorded "User is the FK hub" trap: a bare
 *    user delete fails whenever any child row exists. The failure surfaced as
 *    "Test suite failed to run", poisoning the whole file's result.
 *
 * Additionally, `validatePasswordStrength` was called in a loop whose body was
 * an empty `// If no error thrown, validation passed` comment -- an assertion
 * that asserts nothing. It now asserts the returned structure.
 *
 * WHAT WAS DELIBERATELY *NOT* CHANGED
 * -----------------------------------
 * The wall-clock thresholds (`toBeLessThan(5000)` and friends) are load-
 * sensitive by nature. They are left as they were: rewriting them into
 * something machine-independent would change what the suite measures without a
 * mandate. They are marked below so a future reader knows they are timings, not
 * correctness gates.
 */
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { resetDatabase } from './testDb';
import { enhancedAuthService } from '../services/enhancedAuthService';
import { generateToken } from '../services/tokenService';

// One hash, reused. See defect (1) in the header.
const PASSWORD = 'password123';
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 10);

const TEST_USER_COUNT = 10;

describe('Authentication Performance Tests', () => {
  const testUsers: any[] = [];

  /**
   * Truncate everything, then recreate the shared users.
   *
   * WHY A FULL RESET IS THE ONLY SAFE CLEANUP HERE
   * `User` is the FK hub -- 37 models reference it. `authenticate()`,
   * `verifyMFA()` and `authenticateBiometric()` all write `Session` (and
   * `AuditEntry`) rows for the user they touch, so ANY bare
   * `prisma.user.deleteMany()` throws `Session_userId_fkey`. That is exactly
   * what made the original `afterAll` fail and report the whole file as
   * "Test suite failed to run". TRUNCATE ... CASCADE lets Postgres resolve the
   * dependency order.
   *
   * It must be paired with re-seeding, because later tests read `testUsers`.
   */
  const resetAndSeed = async () => {
    await resetDatabase(prisma);
    testUsers.length = 0;
    for (let i = 0; i < TEST_USER_COUNT; i++) {
      const user = await prisma.user.create({
        data: {
          email: `perf-test-${i}@example.com`,
          password: PASSWORD_HASH,
          firstName: `Test${i}`,
          lastName: `User${i}`,
          role: 'TENANT',
        },
      });
      testUsers.push(user);
    }
  };

  beforeAll(async () => {
    await resetAndSeed();
  });

  afterAll(async () => {
    await resetDatabase(prisma);
    await prisma.$disconnect();
  });

  describe('Authentication Performance', () => {
    it('should handle authentication requests within acceptable time limits', async () => {
      const attempts = testUsers.slice(0, 5).map((user) => ({
        email: user.email,
        password: PASSWORD,
        ipAddress: '127.0.0.1',
        userAgent: 'Performance Test Agent',
        deviceInfo: { platform: 'test' },
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        attempts.map((attempt) => enhancedAuthService.authenticate(attempt))
      );
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / attempts.length;

      // NOTE: wall-clock thresholds are load-sensitive. Measured, not asserted
      // as a correctness property.
      console.log(
        `Authentication: total ${totalTime}ms, avg ${averageTime}ms, ` +
          `${(1000 / averageTime).toFixed(2)} req/s`
      );

      expect(totalTime).toBeLessThan(5000);
      expect(averageTime).toBeLessThan(500);

      // The real assertions: every authentication actually produced a session.
      expect(results).toHaveLength(attempts.length);
      results.forEach((result) => {
        expect(result.user).toBeDefined();
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
        expect(result.sessionId).toBeDefined();
      });
    });

    it('should handle MFA verification performance', async () => {
      // ONE USER PER VERIFICATION. `verifyMFA` -> `completeLogin` stores the
      // deterministic JWT as `Session.sessionToken`; two verifications for the
      // SAME user inside one `iat` second produce an identical token and
      // collide on the unique constraint. This is not a concurrency artifact --
      // it reproduces SEQUENTIALLY, which is why this test needs distinct users
      // to measure anything at all. The defect itself is pinned in the last
      // describe block.
      const mfaUsers = [];
      for (let i = 0; i < 10; i++) {
        mfaUsers.push(
          await prisma.user.create({
            data: {
              email: `mfa-perf-${i}@example.com`,
              password: PASSWORD_HASH,
              firstName: 'MFA',
              lastName: `Perf${i}`,
              role: 'TENANT',
              mfaEnabled: true,
              mfaSecret: 'JBSWY3DPEHPK3PXP',
            },
          })
        );
      }

      // Path corrected: the module is `services/mfaService`, not `../mfaService`.
      // With the old path Jest threw "Cannot find module" and this mock was
      // never installed.
      const mfaModule = require('../services/mfaService');
      const mockVerifyTOTP = jest.spyOn(mfaModule, 'verifyTOTP').mockReturnValue(true);

      try {
        const startTime = Date.now();
        const results = [];
        for (const u of mfaUsers) {
          results.push(await enhancedAuthService.verifyMFA(u.id, '123456'));
        }
        const totalTime = Date.now() - startTime;

        console.log(`MFA: total ${totalTime}ms over ${mfaUsers.length} distinct users`);

        expect(totalTime).toBeLessThan(2000);
        expect(results).toHaveLength(mfaUsers.length);
        // The mock is proven to be in effect, not merely installed.
        expect(mockVerifyTOTP).toHaveBeenCalled();
        results.forEach((r) => expect(r.sessionId).toBeDefined());
      } finally {
        // Restore even on assertion failure; previously this leaked a mock.
        mockVerifyTOTP.mockRestore();
        // `verifyMFA` persists Session/AuditEntry rows, so a bare user delete
        // throws `Session_userId_fkey` -- the FK-hub trap. CASCADE instead.
        await resetAndSeed();
      }
    });

    it('should handle biometric authentication performance', async () => {
      // ONE USER PER AUTHENTICATION, for the same reason as the MFA test:
      // `authenticateBiometric` -> `completeLogin` stores a deterministic JWT as
      // `Session.sessionToken`, so repeat auths for one user inside a single
      // second collide on the unique constraint -- sequentially, not only
      // concurrently.
      const bioUsers = [];
      for (let i = 0; i < 5; i++) {
        const u = await prisma.user.create({
          data: {
            email: `biometric-perf-${i}@example.com`,
            password: PASSWORD_HASH,
            firstName: 'Biometric',
            lastName: `Perf${i}`,
            role: 'TENANT',
            biometricEnabled: true,
          },
        });
        await prisma.biometricAuth.create({
          data: {
            userId: u.id,
            credentialId: `biometric-perf-cred-${i}`,
            publicKey: `biometric-public-key-${i}`,
            deviceType: 'fingerprint',
            isActive: true,
          },
        });
        bioUsers.push(u);
      }

      try {
        const startTime = Date.now();
        const results = [];
        for (let i = 0; i < bioUsers.length; i++) {
          results.push(
            await enhancedAuthService.authenticateBiometric(`biometric-perf-cred-${i}`, {
              platform: 'iOS',
              requestId: i,
            })
          );
        }
        const totalTime = Date.now() - startTime;

        console.log(`Biometric: total ${totalTime}ms over ${bioUsers.length} distinct users`);

        expect(results).toHaveLength(bioUsers.length);
        results.forEach((r) => {
          expect(r.user).toBeDefined();
          expect(r.accessToken).toBeDefined();
        });
      } finally {
        // CASCADE: `authenticateBiometric` -> `completeLogin` writes Session
        // and AuditEntry rows, so a bare user delete throws `Session_userId_fkey`.
        await resetAndSeed();
      }
    });
  });

  describe('Session Management Performance', () => {
    it('should handle session validation efficiently', async () => {
      const sessions = [];
      for (let i = 0; i < 25; i++) {
        const user = testUsers[i % testUsers.length];
        const sessionInfo = {
          // Unique per iteration. Using a fixed string here would collide with
          // `Session.sessionToken @unique` on the second insert.
          sessionToken: `session-token-${Date.now()}-${i}`,
          userId: user.id,
          ipAddress: `127.0.0.${i % 255}`,
          userAgent: `Session Test Agent ${i}`,
          deviceInfo: { platform: 'test' },
          expiresAt: new Date(Date.now() + 3600000),
        };
        const sessionId = await enhancedAuthService.createSession(sessionInfo);
        sessions.push({ sessionId, token: sessionInfo.sessionToken });
      }

      const startTime = Date.now();
      const validationResults = await Promise.all(
        sessions.map((s) => enhancedAuthService.validateSession(s.token))
      );
      const totalTime = Date.now() - startTime;

      console.log(`Session validation: total ${totalTime}ms over ${sessions.length}`);

      expect(totalTime).toBeLessThan(2000);
      expect(validationResults).toHaveLength(sessions.length);
      // Every stored token must resolve to its user -- proving the rows were
      // written, not merely requested.
      validationResults.forEach((r) => {
        expect(r).not.toBeNull();
        expect(r!.id).toBeDefined();
      });
    });
  });

  describe('Password Validation Performance', () => {
    it('should validate passwords efficiently', async () => {
      const user = testUsers[0];
      const testPasswords = [
        'MyStr0ngP@ssw0rd!',
        'C0mpl3xP@ss123!',
        'V3ryS3cur3P@ss!',
        'T0pS3cr3tP@ss!',
        'Ult1m@t3P@ssw0rd!',
      ];

      const startTime = Date.now();
      const validationResults = await Promise.all(
        testPasswords.map((p) => enhancedAuthService.validatePasswordStrength(p, user.id))
      );
      const totalTime = Date.now() - startTime;

      console.log(`Password validation: total ${totalTime}ms over ${testPasswords.length}`);

      expect(totalTime).toBeLessThan(500);
      // CORRECTED ASSERTION. `validatePasswordStrength(password, userId)` is
      // typed `Promise<void>` -- it returns NOTHING and signals a policy breach
      // by THROWING an AppError. The original loop body was an empty comment; my
      // first rewrite asserted `toHaveProperty('isValid')`, which was wrong for
      // the same reason a phantom column is wrong: it asserted a field that does
      // not exist. B-class (test wrong), corrected rather than relaxed.
      //
      // So the meaningful assertion is: all five strong passwords RESOLVE.
      expect(validationResults).toHaveLength(testPasswords.length);
      validationResults.forEach((r) => expect(r).toBeUndefined());
    });

    it('rejects a password that violates policy (the failure path is a throw, not a value)', async () => {
      // Pins the contract the assertion above depends on: if this ever returns
      // a falsy object instead of throwing, the "all resolve" test would go
      // green while validating nothing.
      //
      // The input is chosen to isolate ONE rule. 'Aa1!' is 4 characters but has
      // upper, lower, digit and special, so ONLY the length rule can reject it.
      // Using 'weak' here was a mistake: it lacks an uppercase letter too, so
      // gutting the length check still left the uppercase check throwing and
      // this test stayed green. Verified by mutation -- see REFERENCE.
      const user = testUsers[0];
      await expect(
        enhancedAuthService.validatePasswordStrength('Aa1!', user.id)
      ).rejects.toThrow(/at least/i);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not have memory leaks during concurrent operations', async () => {
      const initialMemory = process.memoryUsage();

      // 10 concurrent logins across DISTINCT users. One user would collide on
      // `sessionToken` (see the last describe block), so distinctness is not a
      // convenience here -- it is what makes the measurement valid.
      const operations = testUsers.map((user, i) =>
        enhancedAuthService.authenticate({
          email: user.email,
          password: PASSWORD,
          ipAddress: `127.0.0.${i % 255}`,
          userAgent: `Memory Test Agent ${i}`,
          deviceInfo: { platform: 'test' },
        })
      );

      const results = await Promise.all(operations);
      expect(results).toHaveLength(testUsers.length);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(
        `Memory: initial ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB, ` +
          `final ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB, ` +
          `delta ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`
      );

      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  /* =================================================================== *
   * THE REAL DEFECT — latent, not live
   * =================================================================== */
  describe('sessionToken collision (REAL DEFECT, latent)', () => {
    it('two logins for ONE user in the same second produce an identical sessionToken', async () => {
      // `enhancedAuthService.completeLogin` (line ~372) stores
      // `generateToken(user)` as `Session.sessionToken`, which is `@unique`.
      // `generateToken` signs {id, email, role} with `expiresIn: '15m'` and NO
      // `jti`, so the payload is identical and JWT `iat` is second-granularity
      // -- two logins in the same second yield a BYTE-IDENTICAL token.
      //
      // Consequence: the second `session.create` throws
      //   Unique constraint failed on the fields: (`sessionToken`)
      // and the login fails for a user who did nothing wrong. A double-clicked
      // login button is enough to trigger it -- concurrency is NOT required.
      //
      // STATUS: LATENT. No route reaches this flow today (see the file header),
      // so it is pinned rather than "fixed" -- changing JWT issuance or the
      // session key is an auth-design decision with migration implications.
      //
      // HOW THIS IS PINNED, AND WHY NOT BY OBSERVING THE ERROR
      // Asserting "the second login throws" was NOT sufficient: when the defect
      // is fixed the second login simply succeeds, and a tolerant `if (err) {}
      // else {}` reaches a green branch that cannot tell "fixed" from "not
      // reproduced this run". Verified -- adding a `jti` left that version
      // green. So the assertion targets the ROOT CAUSE instead: the token
      // function itself is deterministic per user per second.
      //
      // This test ASSERTS THE DEFECT EXISTS. When a `jti` (or a random session
      // key) lands, this goes red on purpose -- delete it at that point.
      await resetAndSeed();
      const user = testUsers[0];

      const row = await prisma.user.findUnique({ where: { id: user.id } });

      // The root cause, stated directly: two calls, zero elapsed time between
      // token generation, identical output.
      const tokenA = generateToken(row);
      const tokenB = generateToken(row);

      expect(tokenA).toBe(tokenB); // <-- red the moment a jti is added

      // And the mechanism that turns that into a failed login.
      await prisma.session.create({
        data: { userId: user.id, sessionToken: tokenA, expiresAt: new Date(Date.now() + 3_600_000) },
      });

      let collision: any = null;
      try {
        await prisma.session.create({
          data: { userId: user.id, sessionToken: tokenB, expiresAt: new Date(Date.now() + 3_600_000) },
        });
      } catch (e) {
        collision = e;
      }

      expect(collision).not.toBeNull();
      expect(String(collision.message)).toMatch(/sessionToken/i);

      // Finally, confirm the real service path reproduces it end-to-end.
      // Two sequential logins for one user: the second must fail.
      let serviceErr: any = null;
      try {
        await enhancedAuthService.authenticate({
          email: user.email,
          password: PASSWORD,
          ipAddress: '127.0.0.1',
          userAgent: 'Collision Probe',
          deviceInfo: { platform: 'test' },
        });
        await enhancedAuthService.authenticate({
          email: user.email,
          password: PASSWORD,
          ipAddress: '127.0.0.1',
          userAgent: 'Collision Probe',
          deviceInfo: { platform: 'test' },
        });
      } catch (e) {
        serviceErr = e;
      }
      expect(serviceErr).not.toBeNull();
      expect(String(serviceErr.message)).toMatch(/sessionToken/i);
    });
  });
});
