// @ts-nocheck
/**
 * `whiteLabel.service.createWhiteLabelConfig` -- the last phantom-column fix
 * with no test behind it.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `createWhiteLabelConfig` built its payload with `user: { connect: { id } }`
 * and silenced the compiler with a single `as any` on the whole `data` object:
 *
 *     data: {
 *       ...,
 *       userId: data.userId,
 *       Rental: { connect: { id: data.rentalId } },
 *       user: { connect: { id: data.userId } },   // <-- no such relation
 *     } as any,
 *
 * `WhiteLabelConfig` has no `user` relation -- it is `User` (capital), and
 * `userId` was already being set on the line above, so the phantom relation was
 * both invalid AND redundant. Against the live schema:
 *
 *     Unknown argument `user`. Did you mean `userId`?
 *
 * So EVERY `createWhiteLabelConfig` threw, and the route is live:
 * `app.ts:169` mounts `/api/white-label`, `routes/whiteLabel.routes.ts:7`
 * exposes `POST /white-label-config`, `controller:165` calls this function.
 *
 * It stayed hidden for two reasons. `tsc` was blind because of the `as any`,
 * and the ONLY existing coverage of this module is
 * `src/__tests__/property-scoped-authz.test.ts`, which exercises GET / PUT /
 * DELETE and creates its fixture rows with `prisma.whiteLabelConfig.create`
 * directly -- so it never called the broken function. The one path that was
 * 100% broken was the one path with no test. Same shape as
 * `googleCalendar.service.ts` in the previous session.
 *
 * WHAT IS ASSERTED
 *  1. The row is created with the owning `userId` and the attached `Rental`
 *     (red before the fix: the create threw, so no row existed).
 *  2. The persisted row has no `user` property -- the phantom relation is gone,
 *     so reintroducing it throws again instead of passing silently.
 *  3. A second config with the same `token` is rejected by `token @unique`.
 *     This pins that the token really lands in its own column rather than
 *     being swallowed by a phantom key.
 *  4. `getWhiteLabelConfigByPropertyId` finds the row created here -- the
 *     create and read halves agree on how a config attaches to a property.
 *
 * WHY PRISMA IS REAL
 * ------------------
 * A mocked client accepts any payload; that is the whole reason `user:{connect}`
 * survived. Only the real client validates query arguments against the schema.
 *
 * Note on the schema: `WhiteLabelConfig` reaches `Rental` two ways -- a named
 * many-to-many (`rentals`) and the back-relation `Rental` of
 * `Rental.whiteLabelConfigId`. `Rental: { connect }` populates the latter, so
 * the read helper below (which queries through `Rental: { some: { id } }`) sees
 * exactly the row this test creates. That is why assertion 4 is meaningful.
 */
import { prisma } from '../config/database';
import { resetDatabase } from '../__tests__/testDb';

let svc: any;
let ownerId: string;
let rentalId: string;

beforeAll(async () => {
  await resetDatabase(prisma);

  svc = require('./whiteLabel.service');

  const owner = await prisma.user.create({
    data: {
      email: 'wl-owner@example.com',
      password: 'hashed-not-used',
      firstName: 'White',
      lastName: 'Label',
      role: 'PROPERTY_MANAGER',
    },
  });
  ownerId = owner.id;

  const rental = await prisma.rental.create({
    data: {
      title: 'White Label Test Property',
      address: '10 Branded Ave',
      city: 'Edmonton',
      state: 'AB',
      zipCode: 'T5K0A9',
      rent: 2200,
      slug: 'white-label-test-property',
      propertyType: 'APARTMENT',
      managerId: ownerId,
      ownerId: ownerId,
      createdById: ownerId,
    },
  });
  rentalId = rental.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

const payload = (token: string) => ({
  appName: 'Branded App',
  logoUrl: 'https://cdn.example.com/logo.png',
  primaryColor: '#112233',
  secondaryColor: '#445566',
  token,
  platform: 'web',
  userId: ownerId,
  rentalId,
});

describe('createWhiteLabelConfig', () => {
  it('persists the config with the owning userId and the attached rental', async () => {
    const created = await svc.createWhiteLabelConfig(payload('tok-create-1'));

    // Pre-fix this call threw `Unknown argument 'user'` before any insert, so
    // `created` was never produced at all.
    expect(created).toBeTruthy();
    expect(created.id).toBeTruthy();

    const row = await prisma.whiteLabelConfig.findUnique({
      where: { id: created.id },
      include: { Rental: { select: { id: true } } },
    });

    expect(row).not.toBeNull();
    expect(row!.userId).toBe(ownerId);
    expect(row!.appName).toBe('Branded App');
    expect(row!.platform).toBe('web');

    // `user: { connect }` was the phantom. `userId` above is what actually
    // links the row, and it is a required scalar -- so this pair is the pin.
    expect(Object.keys(row!)).not.toContain('user');
    expect(row!.Rental.map((r) => r.id)).toContain(rentalId);
  });

  it('rejects a duplicate token via the unique constraint', async () => {
    await svc.createWhiteLabelConfig(payload('tok-unique-dup'));

    // `token String @unique` is the branded app's credential. If the token were
    // being written through some phantom key instead of its own column, this
    // second insert would succeed.
    await expect(
      svc.createWhiteLabelConfig(payload('tok-unique-dup'))
    ).rejects.toBeTruthy();

    const rows = await prisma.whiteLabelConfig.findMany({
      where: { token: 'tok-unique-dup' },
    });
    expect(rows).toHaveLength(1);
  });

  it('is found by getWhiteLabelConfigByPropertyId (create and read agree)', async () => {
    const created = await svc.createWhiteLabelConfig(payload('tok-readback'));

    const found = await svc.getWhiteLabelConfigByPropertyId(rentalId);

    expect(found).not.toBeNull();
    // The read helper resolves through the `Rental` relation, so this only
    // holds if the create actually attached the property (not just set a
    // scalar that nothing reads).
    expect(found!.token).toBe('tok-readback');
    expect(found!.id).toBeDefined();

    const persisted = await prisma.whiteLabelConfig.findUnique({
      where: { id: created.id },
    });
    expect(persisted!.userId).toBe(ownerId);
  });
});
