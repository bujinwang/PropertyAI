import http from 'http';
import request from 'supertest';
import app from '../app';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import { resetDatabase } from './testDb';

// One listener for the whole file. Passing the app to supertest makes it call
// `app.listen(0)` and close the listener again on every request, so requests
// can race the previous close (spurious 404 / socket hang up). Binding once and
// passing the server keeps every request on the real Express stack.
let server: http.Server;

describe('Manager API', () => {
  let token: string;
  let managerUser: any;
  let workOrder: any;
  let quote: any;

  beforeAll(async () => {
    server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    // Reset HERE, not only in afterAll. `requireAuth` re-hydrates the JWT
    // subject from Postgres on every request, so a suite that truncates the DB
    // in its own afterAll (any neighbouring suite running first) leaves this
    // suite's fixture user deleted — every request then 401s with "User not
    // found" and the assertions fail for a reason that has nothing to do with
    // the code under test. Resetting in beforeAll makes this suite
    // order-independent; keeping the afterAll reset means it also leaves a
    // clean DB behind.
    await resetDatabase(prisma);

    // Create a manager user for testing.
    // `password` must be a real bcrypt hash: login does bcrypt.compare(), so a
    // literal 'password' string could never authenticate.
    managerUser = await prisma.user.create({
      data: {
        email: 'manager-test@example.com',
        password: await bcrypt.hash('password', 10),
        role: 'PROPERTY_MANAGER',
        firstName: 'Test',
        lastName: 'Manager',
      },
    });

    // Log in to get a token. The email must match the user created above, and
    // the token is nested at body.data.token (not body.token).
    const res = await request(server)
      .post('/api/auth/login')
      .send({ email: 'manager-test@example.com', password: 'password' });
    token = res.body?.data?.token;

    // Create a work order and quote for testing
    const tenantUser = await prisma.user.create({
        data: {
            email: 'tenant2@test.com',
            password: 'password',
            role: 'TENANT',
            firstName: 'Test',
            lastName: 'Tenant',
        }
    });
    
    const rental = await prisma.rental.create({
        data: {
            title: 'Test Property Unit 102',
            address: '456 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '54321',
            country: 'USA',
            propertyType: 'APARTMENT',
            unitNumber: '102',
            bedrooms: 2,
            bathrooms: 1,
            rent: 1200,
            deposit: 1200,
            managerId: managerUser.id,
            ownerId: managerUser.id,
            createdById: managerUser.id,
            status: 'ACTIVE',
            isAvailable: false,
            slug: 'test-rental-slug',
        }
    });
    
    const maintenanceRequest = await prisma.maintenanceRequest.create({
        data: {
            title: 'Broken Heater',
            description: 'The heater is not working.',
            rentalId: rental.id, // Use rentalId instead of propertyId and unitId
            requestedById: tenantUser.id,
        }
    });
    
    const vendor = await prisma.vendor.create({
        data: {
            name: 'Test Vendor 2',
            phone: '0987654321',
            email: 'vendor2@test.com',
            address: '456 Test St',
            specialty: 'HVAC',
            availability: 'AVAILABLE',
            serviceAreas: ['City B'],
            certifications: ['Cert B'],
        }
    });
    
    workOrder = await prisma.workOrder.create({
      data: {
        title: 'Broken Heater',
        description: 'The heater is not working.',
        maintenanceRequestId: maintenanceRequest.id,
        priority: 'LOW',
      },
    });
    
    quote = await prisma.workOrderQuote.create({
        data: {
            workOrderId: workOrder.id,
            vendorId: vendor.id,
            amount: 300.00,
            details: 'Heater replacement',
        }
    });
  });

  afterAll(async () => {
    // TRUNCATE ... CASCADE instead of a hand-ordered delete chain. The previous
    // list deleted `workOrder` before `WorkOrderAssignment`, which violates
    // WorkOrderAssignment_workOrderId_fkey and made the whole suite report
    // "Test suite failed to run" even when every assertion passed.
    await resetDatabase(prisma);
    await prisma.$disconnect();
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('GET /api/manager/work-orders/:id/quotes', () => {
    it('should fetch quotes for a work order', async () => {
      const res = await request(server)
        .get(`/api/manager/work-orders/${workOrder.id}/quotes`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].id).toBe(quote.id);
    });
  });

  describe('POST /api/manager/quotes/:id/approve', () => {
    it('should approve a quote and update the work order', async () => {
      const res = await request(server)
        .post(`/api/manager/quotes/${quote.id}/approve`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      const updatedQuote = await prisma.workOrderQuote.findUnique({ where: { id: quote.id } });
      expect(updatedQuote?.status).toBe('ACCEPTED');

      const updatedWorkOrder = await prisma.workOrder.findUnique({ where: { id: workOrder.id } });
      expect(updatedWorkOrder?.status).toBe('ASSIGNED');
    });
  });

  describe('POST /api/manager/quotes/:id/reject', () => {
    it('should reject a quote', async () => {
      const res = await request(server)
        .post(`/api/manager/quotes/${quote.id}/reject`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      const updatedQuote = await prisma.workOrderQuote.findUnique({ where: { id: quote.id } });
      expect(updatedQuote?.status).toBe('REJECTED');
    });
  });
});