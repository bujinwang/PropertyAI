import request from 'supertest';
import app from '../app';
import { prisma } from '../config/database';

describe('Manager API', () => {
  let token: string;
  let managerUser: any;
  let workOrder: any;
  let quote: any;

  beforeAll(async () => {
    // Create a manager user for testing
    managerUser = await prisma.user.create({
      data: {
        email: 'manager-test@example.com',
        password: 'password',
        role: 'PROPERTY_MANAGER',
        firstName: 'Test',
        lastName: 'Manager',
      },
    });

    // Log in to get a token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager@test.com', password: 'password' });
    token = res.body.token;

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
    await prisma.workOrderQuote.deleteMany({});
    await prisma.workOrder.deleteMany({});
    await prisma.maintenanceRequest.deleteMany({});
    await prisma.rental.deleteMany({});
    await prisma.vendor.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('GET /api/manager/work-orders/:id/quotes', () => {
    it('should fetch quotes for a work order', async () => {
      const res = await request(app)
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
      const res = await request(app)
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
      const res = await request(app)
        .post(`/api/manager/quotes/${quote.id}/reject`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      const updatedQuote = await prisma.workOrderQuote.findUnique({ where: { id: quote.id } });
      expect(updatedQuote?.status).toBe('REJECTED');
    });
  });
});