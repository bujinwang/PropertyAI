import request from 'supertest';
import { app } from '../app';
import { prisma } from '../config/database';
import { resetDatabase } from './testDb';
import { triageService } from '../services/triage.service';

/**
 * Re-triage persistence.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `triage.service.ts` used to write the category NAME returned by
 * `nlpService.extractDetails()` ('PLUMBING') straight into
 * `MaintenanceRequest.categoryId`, which is a FOREIGN KEY to
 * `MaintenanceRequestCategory.id`. That is a guaranteed
 * `P2003 ... MaintenanceRequest_categoryId_fkey` on every re-triage.
 *
 * It went unnoticed because its only caller, `contractorService.declineWorkOrder`,
 * now treats re-triage as best-effort: it unassigns and reopens the work order
 * first, then swallows a triage failure so a successful decline is not reported
 * as a 500. Correct for the endpoint — but it means `contractor.test.ts` stays
 * green even with the FK bug reinstated (verified by mutation). This file pins
 * the triage behaviour itself, so the fix cannot silently rot.
 */
describe('Triage service', () => {
  let server: any;
  let rentalId: string;
  let userId: string;

  beforeAll(async () => {
    await resetDatabase(prisma);
    server = app.listen(0);

    const user = await prisma.user.create({
      data: {
        email: 'triage-tenant@example.com',
        password: 'not-a-real-hash',
        firstName: 'Triage',
        lastName: 'Tenant',
        role: 'TENANT',
      },
    });
    userId = user.id;

    const rental = await prisma.rental.create({
      data: {
        title: 'Triage Property Unit 1',
        address: '1 Triage St',
        slug: 'triage-rental-slug',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA',
        propertyType: 'APARTMENT',
        unitNumber: '1',
        rent: 1000,
        deposit: 1000,
        managerId: user.id,
        ownerId: user.id,
        createdById: user.id,
        status: 'ACTIVE',
        isAvailable: false,
      },
    });
    rentalId = rental.id;
  });

  afterAll(async () => {
    await resetDatabase(prisma);
    await prisma.$disconnect();
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  async function makeRequest(description: string) {
    return prisma.maintenanceRequest.create({
      data: {
        title: 'Triage fixture',
        description,
        rentalId,
        requestedById: userId,
      },
    });
  }

  it('persists a real category FK instead of writing the category name into it', async () => {
    // 'leak' drives nlp.service's deterministic fallback to PLUMBING (no API key
    // in test), so this does not depend on Gemini being reachable.
    const maintenanceRequest = await makeRequest('There is a leak under the sink');

    await expect(triageService.triageRequest(maintenanceRequest.id)).resolves.not.toThrow();

    const updated = await prisma.maintenanceRequest.findUnique({
      where: { id: maintenanceRequest.id },
      include: { MaintenanceRequestCategory: true },
    });

    // The FK must resolve to an actual category row.
    expect(updated?.categoryId).toBeTruthy();
    expect(updated?.MaintenanceRequestCategory).not.toBeNull();
    expect(updated?.MaintenanceRequestCategory?.name).toBe('PLUMBING');

    // And the raw column must NOT hold the name.
    expect(updated?.categoryId).not.toBe('PLUMBING');
  });

  it('sets a valid Priority on the request', async () => {
    const maintenanceRequest = await makeRequest('The power outlet is sparking, electrical issue');

    await triageService.triageRequest(maintenanceRequest.id);

    const updated = await prisma.maintenanceRequest.findUnique({
      where: { id: maintenanceRequest.id },
    });
    expect(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).toContain(updated?.priority);
  });

  it('reuses an existing category row rather than creating duplicates', async () => {
    const first = await makeRequest('Another leak in the bathroom');
    const second = await makeRequest('Yet another leak in the kitchen');

    await triageService.triageRequest(first.id);
    await triageService.triageRequest(second.id);

    const categories = await prisma.maintenanceRequestCategory.findMany({
      where: { name: 'PLUMBING' },
    });
    expect(categories).toHaveLength(1);
  });
});
