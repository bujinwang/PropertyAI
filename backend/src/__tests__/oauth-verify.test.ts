// @ts-nocheck
/**
 * OAuth sign-in — Google and Facebook both failed 100% of the time.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `src/config/passport.ts` wrote the OAuth token upsert against column names
 * that DO NOT EXIST on `OAuthConnection`:
 *
 *     where:  { provider_userId: { provider, userId } }
 *     create: { provider, providerUserId, ... }
 *
 * The real model (prisma/schema.prisma) is:
 *
 *     model OAuthConnection {
 *       provider    String
 *       providerId  String        <-- NOT `providerUserId`
 *       userId      String
 *       ...
 *       @@unique([provider, providerId])
 *     }
 *
 * So three names were wrong at once:
 *   1. the column is `providerId`, not `providerUserId`;
 *   2. the `@@unique([provider, providerId])` compound key is therefore
 *      `provider_providerId`, not `provider_userId`;
 *   3. the compound key's second member is the PROVIDER's id (`profile.id`),
 *      not our internal `userId`.
 *
 * The call sat behind `(prisma as any)`, so `tsc` could not see any of it.
 * The throw happened INSIDE the verify callback and was passed to `done(err)`,
 * which passport reports to the user as a generic authentication failure — so
 * the observable symptom was "OAuth login just doesn't work", with no error
 * pointing at the schema.
 *
 * Verified empirically before this file was written:
 *   - as written  -> PrismaClientValidationError:
 *     "Unknown argument `provider_userId`. Available options are marked with ?"
 *     (and the same for `create.providerUserId`)
 *   - schema-correct -> succeeds, row persisted.
 *
 * WHAT IS ASSERTED
 *  1. The Google verify callback completes with NO error for a new user
 *     (this is the assertion that was red before the fix).
 *  2. It completes for an EXISTING user (second sign-in takes the `update`
 *     branch rather than `create`).
 *  3. The persisted row carries `providerId = profile.id` — i.e. the compound
 *     key is `provider_providerId` and stores the provider's id.
 *  4. The Facebook verify callback completes with no error too.
 *  5. Re-signing in does not create a duplicate row (upsert really upserts).
 *
 * WHY THE STRATEGY IS STUBBED RATHER THAN THE ROUTE DRIVEN
 * -------------------------------------------------------
 * `passport.authenticate('google')` needs a live Google round-trip: a 302 to
 * accounts.google.com, a code exchange, and a token response. None of that is
 * reachable in CI, and a test that mocks all of it would be asserting its own
 * mocks rather than our callback. The defect lives in the verify callback, so
 * that is what is exercised. `passport.use` is intercepted, the real verify
 * function is captured, and it is called directly with a Google-shaped
 * profile. Everything downstream of it is the real code and the real database.
 *
 * WHY THE PRISMA CLIENT IS SPY-SWAPPED
 * ------------------------------------
 * `config/passport.ts` constructs its own module-scope `new PrismaClient()`
 * (one of 61 such sites repo-wide). That client points at the same database
 * as the shared one, so the upsert is genuinely executed and genuinely
 * persisted — but a second client would also need its own `$disconnect()`, and
 * Jest would hang on it (a recorded landmine). Swapping the spied client's
 * `oAuthConnection` delegate onto the shared client keeps one connection, and
 * lets `beforeEach` clear call history.
 *
 * The strategy is registered by `configurePassport()`, which is only reached
 * when `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set — see the guard at
 * the top of the file. CI has no OAuth secrets, so they are set here BEFORE
 * the module is (re)loaded.
 */
import { prisma } from '../config/database';
import { resetDatabase } from './testDb';

const OAUTH_ENV = {
  GOOGLE_CLIENT_ID: 'test-google-client-id',
  GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
  FACEBOOK_CLIENT_ID: 'test-facebook-client-id',
  FACEBOOK_CLIENT_SECRET: 'test-facebook-client-secret',
};

let captured: Record<string, Function>;
let passportModule: any;
let passportConfig: any;

beforeAll(async () => {
  await resetDatabase(prisma);

  Object.assign(process.env, OAUTH_ENV);

  // Intercept strategy registration so the real verify callback can be called
  // directly.
  //
  // NOTE: do NOT wrap the config require in `jest.isolateModules()`. That
  // gives a SEPARATE module registry, so the `passport` instance the config
  // registers into is not the instance being spied on -- the spy then captures
  // nothing and every test fails with `strategy "google" was not registered`.
  // Both requires below must resolve the same singleton.
  const passport = require('passport');
  passportModule = passport.default || passport;
  captured = {};
  jest.spyOn(passportModule, 'use').mockImplementation((strategy: any) => {
    // `strategy.name` is 'google' / 'facebook'
    captured[strategy.name] = strategy._verify;
  });

  // The env guards live INSIDE `configurePassport()`, so they read the vars set
  // above at call time. Requiring the module does not register anything.
  passportConfig = require('../config/passport').default;
  passportConfig();
});

afterAll(async () => {
  jest.restoreAllMocks();
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.FACEBOOK_CLIENT_ID;
  delete process.env.FACEBOOK_CLIENT_SECRET;
  await prisma.$disconnect();
});

/**
 * Run a verify callback and resolve with its (err, user) result.
 *
 * Fails fast if the callback never calls `done`. Without the timer a callback
 * that throws synchronously (an `async` verify whose body throws outside its
 * own try, or a broken `catch`) leaves the promise pending forever and Jest
 * reports "Exceeded timeout of 5000 ms" -- which reads like a slow test rather
 * than "the callback never reported an outcome". Diagnosing that cost a cycle
 * during mutation testing.
 */
function verify(
  provider: 'google' | 'facebook',
  accessToken: string,
  profile: any
) {
  return new Promise<{ err: any; user: any }>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`verify callback for "${provider}" never called done()`)),
      2000
    );
    const done = (err: any, user?: any) => {
      clearTimeout(timer);
      resolve({ err, user });
    };
    const fn = captured[provider];
    if (!fn) {
      clearTimeout(timer);
      reject(new Error(`strategy "${provider}" was not registered`));
      return;
    }
    try {
      fn(accessToken, 'refresh-token', profile, done);
    } catch (e) {
      clearTimeout(timer);
      reject(e as Error);
    }
  });
}

const googleProfile = (id: string, email: string) => ({
  id,
  displayName: 'OAuth Person',
  emails: [{ value: email, verified: true }],
  name: { givenName: 'OAuth', familyName: 'Person' },
});

const facebookProfile = (id: string, email: string) => ({
  id,
  displayName: 'Fb Person',
  emails: [{ value: email }],
  name: { givenName: 'Fb', familyName: 'Person' },
});

describe('OAuth verify callbacks', () => {
  it('registers both strategies when credentials are present', () => {
    expect(captured.google).toBeInstanceOf(Function);
    expect(captured.facebook).toBeInstanceOf(Function);
  });

  it('completes Google sign-in for a NEW user with no error', async () => {
    const { err, user } = await verify(
      'google', 'access-token-1', googleProfile('google-uid-1', 'oauth-new@example.com')
    );

    // The pre-fix failure was `PrismaClientValidationError: Unknown argument
    // provider_userId`, delivered through `done(err)`.
    expect(err).toBeNull();
    expect(user).toBeTruthy();
    expect(user.email).toBe('oauth-new@example.com');
  });

  it('persists the connection with providerId = the PROVIDER id', async () => {
    const row = await prisma.oAuthConnection.findFirst({
      where: { provider: 'GOOGLE', providerId: 'google-uid-1' },
    });

    expect(row).toBeTruthy();
    // The compound key is [provider, providerId] -- pin that the provider's own
    // id is what is stored, not our internal userId.
    expect(row!.providerId).toBe('google-uid-1');
    expect(row!.accessToken).toBe('access-token-1');

    const owner = await prisma.user.findFirst({ where: { email: 'oauth-new@example.com' } });
    expect(owner).toBeTruthy();
    expect(row!.userId).toBe(owner!.id);
  });

  it('completes Google sign-in for an EXISTING user (update branch)', async () => {
    const { err, user } = await verify(
      'google', 'access-token-2', googleProfile('google-uid-1', 'oauth-new@example.com')
    );

    expect(err).toBeNull();
    expect(user).toBeTruthy();

    const rows = await prisma.oAuthConnection.findMany({
      where: { provider: 'GOOGLE', providerId: 'google-uid-1' },
    });
    // Upsert, not create: the second sign-in must not add a second row.
    expect(rows).toHaveLength(1);
    expect(rows[0].accessToken).toBe('access-token-2');
  });

  it('completes Facebook sign-in with no error', async () => {
    const { err, user } = await verify(
      'facebook', 'fb-token-1', facebookProfile('fb-uid-1', 'oauth-fb@example.com')
    );

    expect(err).toBeNull();
    expect(user).toBeTruthy();

    const row = await prisma.oAuthConnection.findFirst({
      where: { provider: 'FACEBOOK', providerId: 'fb-uid-1' },
    });
    expect(row).toBeTruthy();
    expect(row!.accessToken).toBe('fb-token-1');
  });

  it('reports a specific error when the profile carries no email', async () => {
    const { err } = await verify('google', 'tok', {
      id: 'google-uid-nomail',
      displayName: 'No Mail',
      emails: [],
      name: { givenName: 'No', familyName: 'Mail' },
    });

    // Guard against a regression that turns a missing email into a silent
    // success. Pin the message, not just "something threw" -- bare truthiness
    // here would accept any failure, including a schema error.
    expect(err).toBeTruthy();
    expect(String(err!.message)).toMatch(/no email found/i);
  });

  /**
   * A failure inside the token upsert must FAIL the sign-in, not be swallowed.
   *
   * This test exists because mutation testing found a hole: replacing
   * `done(error)` with `done(null, user)` in the catch left all six original
   * tests green. Nothing forced the upsert to fail, so the swallow was
   * unobservable. That is not a cosmetic gap -- in production it would mean
   * "login succeeded" with the provider tokens silently never stored.
   *
   * The failure is REAL, not mocked: `profile.id` is undefined here, and
   * `OAuthConnection.providerId` is a required column, so Prisma raises
   * `PrismaClientValidationError` from the same `await` a genuine DB fault
   * would come from. Asserting on `err` alone would be satisfied by "anything
   * threw", so the user is asserted to be absent as well: a swallowed failure
   * would resolve `done(null, user)` and hand back a logged-in user.
   */
  it('fails sign-in when the token upsert fails (does not swallow the error)', async () => {
    const { err, user } = await verify('google', 'tok', {
      // no `id` -> create.providerId is undefined -> required column
      id: undefined as any,
      displayName: 'Broken Profile',
      emails: [{ value: 'oauth-broken@example.com', verified: true }],
      name: { givenName: 'Broken', familyName: 'Profile' },
    });

    expect(err).toBeTruthy();
    // The decisive assertion: no authenticated user is handed back.
    expect(user).toBeFalsy();

    // And nothing was persisted for this profile.
    const rows = await prisma.oAuthConnection.findMany({
      where: { provider: 'GOOGLE', providerId: 'undefined' },
    });
    expect(rows).toHaveLength(0);
  });
});
