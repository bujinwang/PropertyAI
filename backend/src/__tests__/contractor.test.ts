import request from 'supertest';
import app from '../app'; // Assuming your Express app is exported from app.ts
import { prisma } from '../config/database';

describe('Contractor API', () => {
  let token: string;
  let vendorUser: any;
  let workOrder: any;

  beforeAll(async () => {
    // Create a vendor user for testing
    vendorUser = await prisma.user.create({
      data: {
        email: 'vendor@test.com',
        password: 'password',
        role: 'VENDOR',
        firstName: 'Test',
        lastName: 'Vendor',
        vendor: {
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
    });

    // Log in to get a token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'vendor@test.com', password: 'password' });
    token = res.body.token;

    // Create a work order for testing
    const tenantUser = await prisma.user.create({
      data: {
        email: 'tenant@test.com',
        password: 'password',
        role: 'TENANT',
        firstName: 'Test',
        lastName: 'Tenant',
      },
    });
    const property = await prisma.property.create({
        data: {
            name: 'Test Property',
            address: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'USA',
            propertyType: 'APARTMENT',
            totalUnits: 1,
            managerId: vendorUser.id, // Or create a manager user
            ownerId: vendorUser.id, // Or create an owner user
        }
    });
    const unit = await prisma.unit.create({
        data: {
            unitNumber: '101',
            propertyId: property.id,
            tenantId: tenantUser.id,
        }
    });
    const maintenanceRequest = await prisma.maintenanceRequest.create({
        data: {
            title: 'Leaky Faucet',
            description: 'The kitchen faucet is dripping.',
            propertyId: property.id,
            unitId: unit.id,
            requestedById: tenantUser.id,
        }
    });
    workOrder = await prisma.workOrder.create({
      data: {
        title: 'Leaky Faucet',
        description: 'The kitchen faucet is dripping.',
        maintenanceRequestId: maintenanceRequest.id,
        assignments: {
          create: {
            vendorId: vendorUser.vendor.id,
          },
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.unit.deleteMany({});
    await prisma.maintenanceRequest.deleteMany({});
    await prisma.workOrder.deleteMany({});
  });

  describe('GET /api/contractor/work-orders', () => {
    it('should fetch work orders for the authenticated contractor', async () => {
      const res = await request(app)
        .get('/api/contractor/work-orders')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].id).toBe(workOrder.id);
    });
  });

  describe('GET /api/contractor/work-orders/:id', () => {
    it('should fetch the details of a specific work order', async () => {
      const res = await request(app)
        .get(`/api/contractor/work-orders/${workOrder.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(workOrder.id);
      expect(res.body.title).toBe('Leaky Faucet');
    });
  });

  describe('POST /api/contractor/work-orders/:id/accept', () => {
    it('should update the work order status to IN_PROGRESS', async () => {
      const res = await request(app)
        .post(`/api/contractor/work-orders/${workOrder.id}/accept`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('IN_PROGRESS');
    });
  });

  describe('PUT /api/contractor/work-orders/:id/status', () => {
    it('should update the work order status', async () => {
      const res = await request(app)
        .put(`/api/contractor/work-orders/${workOrder.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('COMPLETED');
    });
  });

  describe('POST /api/contractor/work-orders/:id/decline', () => {
    it('should decline the work order and set its status to OPEN', async () => {
      const res = await request(app)
        .post(`/api/contractor/work-orders/${workOrder.id}/decline`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      
      const updatedWorkOrder = await prisma.workOrder.findUnique({ where: { id: workOrder.id } });
      expect(updatedWorkOrder?.status).toBe('OPEN');
    });
  });

  describe('POST /api/contractor/work-orders/:id/quote', () => {
    it('should submit a quote for a work order', async () => {
      const res = await request(app)
        .post(`/api/contractor/work-orders/${workOrder.id}/quote`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 250.00, details: 'Premium parts' });

      expect(res.status).toBe(201);
      expect(res.body.amount).toBe(250.00);
      expect(res.body.details).toBe('Premium parts');
    });
  });

  describe('POST /api/contractor/work-orders/:id/invoice', () => {
    it('should submit an invoice for a work order', async () => {
      const res = await request(app)
        .post(`/api/contractor/work-orders/${workOrder.id}/invoice`)
        .set('Authorization', `Bearer ${token}`)
        .send({ invoiceUrl: 'http://example.com/invoice.pdf' });

      expect(res.status).toBe(201);
      expect(res.body.url).toBe('http://example.com/invoice.pdf');
    });
  });

  describe('GET /api/contractor/work-orders/:id/messages', () => {
    it('should fetch messages for a work order', async () => {
      const res = await request(app)
        .get(`/api/contractor/work-orders/${workOrder.id}/messages`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/contractor/work-orders/:id/messages', () => {
    it('should send a message for a work order', async () => {
      const res = await request(app)
        .post(`/api/contractor/work-orders/${workOrder.id}/messages`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Hello, tenant!' });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('Hello, tenant!');
    });
  });
});