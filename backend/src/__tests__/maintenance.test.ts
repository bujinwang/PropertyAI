import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Maintenance Endpoints', () => {
  let authToken: string;
  let userId: string;
  let propertyId: string;
  let unitId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.maintenanceRequest.deleteMany({});
    await prisma.unit.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user and get token
    const user = await prisma.user.create({
      data: {
        email: 'maintenance@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        firstName: 'Maintenance',
        lastName: 'Manager',
        role: 'PROPERTY_MANAGER'
      }
    });
    userId = user.id;

    // Create test property
    const property = await prisma.property.create({
      data: {
        name: 'Maintenance Test Property',
        address: '123 Maintenance St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        propertyType: 'apartment',
        totalUnits: 5,
        ownerId: userId
      }
    });
    propertyId = property.id;

    // Create test unit
    const unit = await prisma.unit.create({
      data: {
        unitNumber: 'M101',
        propertyId: propertyId,
        type: '1-bedroom',
        monthlyRent: 1000,
        squareFootage: 750
      }
    });
    unitId = unit.id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'maintenance@example.com',
        password: 'password'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/maintenance', () => {
    it('should create a new maintenance request', async () => {
      const response = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: propertyId,
          unitId: unitId,
          title: 'Leaky faucet',
          description: 'Kitchen faucet is leaking',
          category: 'plumbing',
          priority: 'medium',
          requestedBy: userId
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Leaky faucet');
      expect(response.body.status).toBe('pending');
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Missing required fields'
          // Missing propertyId, unitId, etc.
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/maintenance', () => {
    beforeEach(async () => {
      await prisma.maintenanceRequest.create({
        data: {
          propertyId: propertyId,
          unitId: unitId,
          title: 'Test maintenance request',
          description: 'Test description',
          category: 'electrical',
          priority: 'high',
          requestedBy: userId,
          status: 'pending'
        }
      });
    });

    it('should get all maintenance requests', async () => {
      const response = await request(app)
        .get('/api/maintenance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter maintenance requests by property', async () => {
      const response = await request(app)
        .get('/api/maintenance')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ propertyId });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((request: any) => {
        expect(request.propertyId).toBe(propertyId);
      });
    });

    it('should filter maintenance requests by status', async () => {
      const response = await request(app)
        .get('/api/maintenance')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'pending' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((request: any) => {
        expect(request.status).toBe('pending');
      });
    });
  });

  describe('GET /api/maintenance/:id', () => {
    let maintenanceId: string;

    beforeEach(async () => {
      const maintenance = await prisma.maintenanceRequest.create({
        data: {
          propertyId: propertyId,
          unitId: unitId,
          title: 'Specific maintenance request',
          description: 'Detailed description',
          category: 'hvac',
          priority: 'low',
          requestedBy: userId,
          status: 'in_progress'
        }
      });
      maintenanceId = maintenance.id;
    });

    it('should get a specific maintenance request', async () => {
      const response = await request(app)
        .get(`/api/maintenance/${maintenanceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(maintenanceId);
      expect(response.body.title).toBe('Specific maintenance request');
    });

    it('should return 404 for non-existent maintenance request', async () => {
      const response = await request(app)
        .get('/api/maintenance/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/maintenance/:id', () => {
    let maintenanceId: string;

    beforeEach(async () => {
      const maintenance = await prisma.maintenanceRequest.create({
        data: {
          propertyId: propertyId,
          unitId: unitId,
          title: 'Update maintenance request',
          description: 'Update description',
          category: 'general',
          priority: 'medium',
          requestedBy: userId,
          status: 'pending'
        }
      });
      maintenanceId = maintenance.id;
    });

    it('should update an existing maintenance request', async () => {
      const response = await request(app)
        .put(`/api/maintenance/${maintenanceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'completed',
          assignedTo: userId,
          estimatedCost: 150,
          scheduledDate: new Date().toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('completed');
      expect(response.body.assignedTo).toBe(userId);
    });

    it('should fail to update non-existent maintenance request', async () => {
      const response = await request(app)
        .put('/api/maintenance/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'completed'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/maintenance/:id', () => {
    let maintenanceId: string;

    beforeEach(async () => {
      const maintenance = await prisma.maintenanceRequest.create({
        data: {
          propertyId: propertyId,
          unitId: unitId,
          title: 'Delete maintenance request',
          description: 'Delete description',
          category: 'appliance',
          priority: 'low',
          requestedBy: userId,
          status: 'cancelled'
        }
      });
      maintenanceId = maintenance.id;
    });

    it('should delete an existing maintenance request', async () => {
      const response = await request(app)
        .delete(`/api/maintenance/${maintenanceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
    });

    it('should fail to delete non-existent maintenance request', async () => {
      const response = await request(app)
        .delete('/api/maintenance/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});