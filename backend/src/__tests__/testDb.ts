// @ts-nocheck
/**
 * Shared database reset helper for integration-style test suites.
 *
 * WHY THIS EXISTS
 * ---------------
 * Suites used to open with a hand-written `beforeEach`/`afterAll` like:
 *
 *   await prisma.complianceReport.deleteMany();
 *   await prisma.auditEntry.deleteMany();
 *   await prisma.user.deleteMany();   // <-- explodes
 *
 * `User` is the hub of this schema: 37 models carry a foreign key to
 * `User.id` (OAuthConnection, Session, Lease, Transaction, AuditEntry, ...).
 * A bare `prisma.user.deleteMany()` therefore fails with:
 *
 *   Foreign key constraint violated: `OAuthConnection_userId_fkey (index)`
 *
 * ...unless every one of those 37 child tables is emptied first, in exactly
 * the right order. Hand-ordering that list is fragile: it silently rots as
 * soon as a model is added, and it has to be duplicated in every suite.
 *
 * `TRUNCATE ... CASCADE` sidesteps ordering entirely — Postgres resolves the
 * dependency graph itself. `RESTART IDENTITY` keeps sequences (and therefore
 * generated ids) stable between tests.
 *
 * Note `_prisma_migrations` is excluded so the migration ledger survives.
 */
import { PrismaClient } from '@prisma/client';

/**
 * Empty every application table in the current database.
 *
 * @param prisma the client under test (passed in so suites keep ownership of
 *               their connection lifecycle, and so this works with a mocked
 *               or injected client).
 */
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  const rows = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
    `SELECT tablename FROM pg_tables WHERE schemaname = $1 AND tablename NOT LIKE $2 AND tablename <> $3`,
    'public',
    '_prisma%',
    '_prisma_migrations'
  );

  if (!rows.length) return;

  const tableList = rows.map((r) => `"public"."${r.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
}

export default resetDatabase;
