import http from 'http';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import app from '../app';
import { prisma } from '../config/database';
import { resetDatabase } from './testDb';

/**
 * Contractor API (`/api/contractor/*`).
 *
 * WHAT WAS WRONG WITH THE PREVIOUS VERSION
 * ----------------------------------------
 * All 9 cases failed for reasons that had nothing to do with the assertions:
 *
 *  1. The fixture user was created with a PLAINTEXT password (`'password'`),
 *     but `authController.login` verifies with `bcrypt.compare`. Login could
 *     never succeed.
 *  2. The fixture user's email was `contractor-test@example.com` while login
 *     was attempted as `vendor@test.com` — a different, nonexistent account.
 *  3. `token = res.body.token`, but login answers `{ data: { token, ... } }`.
 *     So `token` was `undefined` and every request went out as `Bearer undefined`.
 *  4. No `resetDatabase` in `beforeAll`, so run 2 collided on the unique email.
 *     Teardown also used an ordered `deleteMany` chain that violates the
 *     `WorkOrderAssignment_workOrderId_fkey` constraint.
 *
 * The endpoint ITSELF was broken too — see `contractor.controller.ts`: it read
 * `req.user.vendor.id` while `protect` hydrates no `vendor` relation, so every
 * handler threw and answered 500. That is now fixed, and this suite pins the
 * working behaviour plus the assignment check.
 *
 * AUTH SHAPE: login -> `{ data: { token, refreshToken, user } }`.
 * The JWT is signed directly instead, which keeps the fixture independent of the
 * login throttle and of bcrypt cost under load.
 */

let server: http.Server;

describe('Contractor API', () => {
  let token: string;
  let vendorUser: any;
  let vendorId: string;
  let workOrder: any;
  let otherVendorToken: string;

  beforeAll(async () => {
    server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    await resetDatabase(prisma);

    // Password must be a real bcrypt hash: login compares with bcrypt, and even
    // though this suite signs its own JWT, a plaintext value here would make the
    // fixture a lie about how accounts are actually stored.
    const hashedPassword = await bcrypt.hash('password123', 10);

    vendorUser = await prisma.user.create({
      data: {
        email: 'contractor-test@example.com',
        password: hashedPassword,
        role: 'VENDOR',
        firstName: 'Test',
        lastName: 'Vendor',
        Vendor: {
          create: {
            name: 'Test Vendor Inc.',
            phone: '1234567890',
            email: 'vendor@test.com',
            address: '123 Test St',
            specialty: 'Plumbing',
            availability: 'AVAILABLE',
            serviceAreas: ['City A'],
            certifications: ['Cert A'],
          },
        },
      },
      include: { Vendor: true },
    });

    // `Vendor` links back through contactPersonId; the relation on User is
    // capital-V `Vendor`.
    vendorId = vendorUser.Vendor.id;
    token = jwt.sign(
      { id: vendorUser.id, role: 'VENDOR' },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    // A second vendor, used to prove that assignment is enforced: this account
    // must NOT be able to touch the first vendor's work order.
    const otherVendorUser = await prisma.user.create({
      data: {
        email: 'other-vendor@example.com',
        password: hashedPassword,
        role: 'VENDOR',
        firstName: 'Other',
        lastName: 'Vendor',
        Vendor: {
          create: {
            name: 'Other Vendor Inc.',
            phone: '0987654321',
            email: 'other-vendor-biz@example.com',
            address: '456 Other St',
            specialty: 'Electrical',
            availability: 'AVAILABLE',
            serviceAreas: ['City B'],
            certifications: ['Cert B'],
          },
        },
      },
    });
    otherVendorToken = jwt.sign(
      { id: otherVendorUser.id, role: 'VENDOR' },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    const tenantUser = await prisma.user.create({
      data: {
        email: 'tenant@test.com',
        password: hashedPassword,
        role: 'TENANT',
        firstName: 'Test',
        lastName: 'Tenant',
      },
    });

    const rental = await prisma.rental.create({
      data: {
        title: 'Test Property Unit 101',
        address: '123 Test St',
        slug: 'test-rental-slug',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA',
        propertyType: 'APARTMENT',
        unitNumber: '101',
        bedrooms: 1,
        bathrooms: 1,
        rent: 1000,
        deposit: 1000,
        managerId: vendorUser.id,
        ownerId: vendorUser.id,
        createdById: vendorUser.id,
        status: 'ACTIVE',
        isAvailable: false,
      },
    });

    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        title: 'Leaky Faucet',
        description: 'The kitchen faucet is dripping.',
        rentalId: rental.id,
        requestedById: tenantUser.id,
      },
    });

    workOrder = await prisma.workOrder.create({
      data: {
        title: 'Leaky Faucet',
        description: 'The kitchen faucet is dripping.',
        priority: 'MEDIUM',
        maintenanceRequestId: maintenanceRequest.id,
        // Relation field is model-named (`WorkOrderAssignment`), not `assignments`.
        WorkOrderAssignment: {
          create: { vendorId },
        },
      },
    });
  });

  afterAll(async () => {
    // TRUNCATE ... CASCADE, not an ordered deleteMany chain: the chain violated
    // WorkOrderAssignment_workOrderId_fkey.
    await resetDatabase(prisma);
    await prisma.$disconnect();
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('GET /api/contractor/work-orders', () => {
    it('should fetch work orders for the authenticated contractor', async () => {
      const res = await request(server)
        .get('/api/contractor/work-orders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].id).toBe(workOrder.id);
    });

    it('should not leak another vendor\'s work orders', async () => {
      const res = await request(server)
        .get('/api/contractor/work-orders')
        .set('Authorization', `Bearer ${otherVendorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      // The unassigned vendor has an empty list, not the first vendor's work.
      expect(res.body.map((w: any) => w.id)).not.toContain(workOrder.id);
    });
  });

  describe('GET /api/contractor/work-orders/:id', () => {
    it('should fetch the details of a specific work order', async () => {
      const res = await request(server)
        .get(`/api/contractor/work-orders/${workOrder.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(workOrder.id);
      expect(res.body.title).toBe('Leaky Faucet');
    });

    it('should refuse details of a work order the vendor is not assigned to', async () => {
      const res = await request(server)
        .get(`/api/contractor/work-orders/${workOrder.id}`)
        .set('Authorization', `Bearer ${otherVendorToken}`);

      expect(res.status).toBe(403);
    });

    it('should 404 for an unknown work order id', async () => {
      const res = await request(server)
        .get('/api/contractor/work-orders/does-not-exist')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/contractor/work-orders/:id/accept', () => {
    it('should update the work order status to IN_PROGRESS', async () => {
      const res = await request(server)
        .post(`/api/contractor/work-orders/${workOrder.id}/accept`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('IN_PROGRESS');
    });

    it('should refuse an unassigned vendor', async () => {
      const res = await request(server)
        .post(`/api/contractor/work-orders/${workOrder.id}/accept`)
        .set('Authorization', `Bearer ${otherVendorToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/contractor/work-orders/:id/status', () => {
    it('should update the work order status', async () => {
      const res = await request(server)
        .put(`/api/contractor/work-orders/${workOrder.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('COMPLETED');
    });
  });

  describe('POST /api/contractor/work-orders/:id/quote', () => {
    it('should submit a quote for a work order', async () => {
      const res = await request(server)
        .post(`/api/contractor/work-orders/${workOrder.id}/quote`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 250.0, details: 'Premium parts' });

      expect(res.status).toBe(201);
      expect(res.body.amount).toBe(250.0);
      expect(res.body.details).toBe('Premium parts');
    });
  });

  describe('POST /api/contractor/work-orders/:id/invoice', () => {
    it('should submit an invoice for a work order', async () => {
      const res = await request(server)
        .post(`/api/contractor/work-orders/${workOrder.id}/invoice`)
        .set('Authorization', `Bearer ${token}`)
        .send({ invoiceUrl: 'http://example.com/invoice.pdf' });

      expect(res.status).toBe(201);
      expect(res.body.url).toBe('http://example.com/invoice.pdf');
    });
  });

  describe('GET /api/contractor/work-orders/:id/messages', () => {
    it('should fetch messages for a work order', async () => {
      const res = await request(server)
        .get(`/api/contractor/work-orders/${workOrder.id}/messages`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/contractor/work-orders/:id/decline', () => {
    it('should decline the work order and set its status to OPEN', async () => {
      const res = await request(server)
        .post(`/api/contractor/work-orders/${workOrder.id}/decline`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      const updated = await prisma.workOrder.findUnique({ where: { id: workOrder.id } });
      expect(updated?.status).toBe('OPEN');

      // Re-assign so the messaging case below still has an assigned vendor.
      await prisma.workOrderAssignment.create({ data: { workOrderId: workOrder.id, vendorId } });
    });
  });

  describe('POST /api/contractor/work-orders/:id/messages', () => {
    it('should send a message for a work order', async () => {
      const res = await request(server)
        .post(`/api/contractor/work-orders/${workOrder.id}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Hello, tenant!' });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('Hello, tenant!');
    });
  });

  describe('authentication boundary', () => {
    it('should reject an unauthenticated request', async () => {
      const res = await request(server).get('/api/contractor/work-orders');
      expect(res.status).toBe(401);
    });

    it('should reject a non-VENDOR role', async () => {
      const tenant = await prisma.user.findUnique({ where: { email: 'tenant@test.com' } });
      const tenantToken = jwt.sign(
        { id: tenant!.id, role: 'TENANT' },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
      );

      const res = await request(server)
        .get('/api/contractor/work-orders')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(403);
    });
  });
});
