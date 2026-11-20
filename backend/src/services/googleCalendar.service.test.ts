// @ts-nocheck
/**
 * `GoogleCalendarService.handleCallback` -- the OAuth callback that had NO test
 * file at all, while writing two column names that do not exist.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `handleCallback` persisted an `OAuthConnection` behind a single `as any`:
 *
 *     await prisma.oAuthConnection.upsert({
 *       where:  { provider_providerId: { provider: 'google', providerId: userId } },
 *       update: { accessToken, refreshToken, scopes: tokens.scope },   // <-- no such column
 *       create: { provider, providerId, accessToken, refreshToken,
 *                 user: { connect: { id: userId } } },               // <-- relation is `User`
 *     } as any);
 *
 * Against the live schema (`schema.prisma:401`) `OAuthConnection` has no
 * `scopes` column and no `user` relation -- the relation is `User` (capital)
 * and `userId` is a required scalar:
 *
 *     Unknown argument `scopes`. Available options are marked with ?.
 *     Unknown argument `user`. Did you mean `userId`?
 *
 * So EVERY callback threw before touching a row, and the route is live:
 * `app.ts:177` mounts `/api/calendar`, `googleCalendar.routes.ts:50` calls
 * `handleCallback`. The user saw the generic redirect `?error=auth_failed`
 * (line 55) and Calendar was never connected -- for anyone, ever.
 *
 * It survived because the service shipped with ZERO tests. A 100%-broken code
 * path that nothing exercises is invisible: `tsc` was silenced by the `as any`
 * and no suite ever called the function.
 *
 * WHAT IS ASSERTED
 *  1. A successful callback PERSISTS a connection with the access token, the
 *     refresh token, and the owning `userId`. This is the assertion that was
 *     red before the fix (the upsert threw, so no row existed).
 *  2. The persisted row carries no `scopes` property -- the phantom name is
 *     gone, so a reintroduction throws again instead of passing silently.
 *  3. A second callback for the same user UPDATES the existing row rather than
 *     failing on `@@unique([provider, providerId])` -- i.e. reconnecting works.
 *  4. `isConnected` / `disconnectUser` agree with the row that callback wrote.
 *  5. DELIBERATE PIN of the documented key-space split: this flow keys the
 *     connection as `providerId = OUR userId`, while `config/passport.ts` keys
 *     it as `providerId = Google's profile.id`. Same model, same unique
 *     constraint, two key spaces -- a row written by one flow is NOT visible to
 *     the other. That is a data-migration decision, not a typing fix, so it is
 *     pinned here (not silently changed) to force a deliberate update.
 *
 * WHY THE GOOGLE SDK IS STUBBED BUT PRISMA IS REAL
 * ------------------------------------------------
 * The module constructs `new google.auth.OAuth2(...)` at import time and the
 * class holds it as instance state, so the SDK must be mocked before require.
 * The database side is REAL on purpose: a mocked Prisma accepts ANY payload,
 * which is precisely how `scopes` and `user` stayed green in the sibling
 * suites. Only a real client validates query arguments against the schema.
 *
 * Note the `catch` in `handleCallback` discards the underlying error and throws
 * a generic `Failed to authenticate with Google Calendar`. That is why this
 * class of bug is hard to see in production: the real
 * `PrismaClientValidationError` never reaches the caller. The tests below
 * therefore assert on PERSISTED STATE, not on the thrown message.
 */
import { prisma } from '../config/database';
import { resetDatabase } from '../__tests__/testDb';

// The service builds its OAuth2 client at module scope. Mock the SDK before
// the service module is required.
const getTokenMock = jest.fn();
const setCredentialsMock = jest.fn();

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        getToken: getTokenMock,
        setCredentials: setCredentialsMock,
        generateAuthUrl: jest.fn(() => 'https://accounts.google.com/o/oauth2/auth?mock'),
        refreshAccessToken: jest.fn(),
      })),
    },
    calendar: jest.fn(),
  },
}));

jest.mock('../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

let googleCalendarService: any;
let userId: string;

const tokensFor = (suffix: string) => ({
  tokens: {
    access_token: `access-${suffix}`,
    refresh_token: `refresh-${suffix}`,
    // Google returns `scope` (singular). The old code wrote this into a
    // `scopes` field that OAuthConnection does not have.
    scope: 'https://www.googleapis.com/auth/calendar',
    expiry_date: Date.now() + 3600_000,
  },
});

beforeAll(async () => {
  await resetDatabase(prisma);

  ({ googleCalendarService } = require('./googleCalendar.service'));

  const user = await prisma.user.create({
    data: {
      email: 'gcal-owner@example.com',
      password: 'hashed-not-used',
      firstName: 'Cal',
      lastName: 'Owner',
      role: 'PROPERTY_MANAGER',
    },
  });
  userId = user.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(() => {
  getTokenMock.mockReset();
  setCredentialsMock.mockReset();
});

describe('GoogleCalendarService.handleCallback', () => {
  it('persists a connection with the access token, refresh token and owning userId', async () => {
    getTokenMock.mockResolvedValue(tokensFor('one'));

    await googleCalendarService.handleCallback('auth-code-1', userId);

    const row = await prisma.oAuthConnection.findUnique({
      where: { provider_providerId: { provider: 'google', providerId: userId } },
    });

    // Pre-fix this was null: the upsert threw `Unknown argument 'scopes'`
    // before it could create anything, and the catch rethrew a generic error.
    expect(row).not.toBeNull();
    expect(row!.accessToken).toBe('access-one');
    expect(row!.refreshToken).toBe('refresh-one');

    // `user: { connect }` was the second phantom name. The scalar is what
    // actually links the row, and it is required -- so this both pins the
    // owner and proves the create branch set it directly.
    expect(row!.userId).toBe(userId);
    expect(row!.provider).toBe('google');
  });

  it('never writes a `scopes` column (the phantom name that broke every callback)', async () => {
    getTokenMock.mockResolvedValue(tokensFor('two'));

    await googleCalendarService.handleCallback('auth-code-2', userId);

    const row = await prisma.oAuthConnection.findUnique({
      where: { provider_providerId: { provider: 'google', providerId: userId } },
    });

    expect(row).not.toBeNull();
    // If someone reintroduces `scopes`, the real client rejects the payload
    // again and the row above is never updated -- so this pair is the pin.
    expect(Object.keys(row!)).not.toContain('scopes');
    expect(row!.accessToken).toBe('access-two');
  });

  it('updates the existing connection on a repeated callback instead of failing on the unique constraint', async () => {
    getTokenMock.mockResolvedValue(tokensFor('three'));

    await expect(
      googleCalendarService.handleCallback('auth-code-3', userId)
    ).resolves.toBeUndefined();

    const rows = await prisma.oAuthConnection.findMany({
      where: { provider: 'google', providerId: userId },
    });

    // `@@unique([provider, providerId])` means a second create would throw.
    // Reconnecting must UPDATE, so exactly one row may exist.
    expect(rows).toHaveLength(1);
    expect(rows[0].accessToken).toBe('access-three');
  });

  it('reports isConnected and disconnectUser consistently with the row callback wrote', async () => {
    getTokenMock.mockResolvedValue(tokensFor('four'));

    await googleCalendarService.handleCallback('auth-code-4', userId);
    await expect(googleCalendarService.isConnected(userId)).resolves.toBe(true);

    await googleCalendarService.disconnectUser(userId);
    await expect(googleCalendarService.isConnected(userId)).resolves.toBe(false);

    // Leave the fixture in the state the next test expects.
    getTokenMock.mockResolvedValue(tokensFor('five'));
    await googleCalendarService.handleCallback('auth-code-5', userId);
  });

  it('REJECTS when the connection cannot be persisted, and stores nothing', async () => {
    // This test exists because every other test in this file passes when the
    // `catch` merely SWALLOWS the error instead of rethrowing. Verified: making
    // the catch silent left the other 5 tests green. In production that is the
    // worst possible outcome -- `googleCalendar.routes.ts:52` redirects
    // `?success=true` whenever `handleCallback` resolves, so a swallowed error
    // tells the user Calendar is connected when no row was ever written.
    //
    // The failure here is REAL, not mocked: `OAuthConnection.userId` is a
    // required FK to `User`, so a nonexistent id is rejected by Postgres (P2003).
    // That matters -- a mocked rejection proves nothing about the real path, and
    // Prisma delegates are own-properties that prototype patching cannot
    // intercept anyway.
    getTokenMock.mockResolvedValue(tokensFor('fk'));

    await expect(
      googleCalendarService.handleCallback('auth-code-fk', 'no-such-user-id')
    ).rejects.toBeTruthy();

    // And nothing was persisted for that id -- so a swallow cannot fake success.
    const row = await prisma.oAuthConnection.findUnique({
      where: { provider_providerId: { provider: 'google', providerId: 'no-such-user-id' } },
    });
    expect(row).toBeNull();
  });

  it('keys the connection as providerId = our userId, NOT Google profile.id (documented split from passport)', async () => {
    getTokenMock.mockResolvedValue(tokensFor('six'));
    await googleCalendarService.handleCallback('auth-code-6', userId);

    // DELIBERATE PIN -- see the header note. `config/passport.ts` resolves the
    // same model with providerId = Google's profile.id. Both spaces are live,
    // so a row written here is invisible to passport and vice versa. Changing
    // this requires a data migration; this assertion exists so the change
    // cannot happen by accident.
    const byOurUserId = await prisma.oAuthConnection.findUnique({
      where: { provider_providerId: { provider: 'google', providerId: userId } },
    });
    expect(byOurUserId).not.toBeNull();

    const byGoogleId = await prisma.oAuthConnection.findUnique({
      where: { provider_providerId: { provider: 'google', providerId: 'google-profile-id-123' } },
    });
    expect(byGoogleId).toBeNull();
  });
});
