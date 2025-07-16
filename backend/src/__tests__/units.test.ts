import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Units Endpoints', () => {
  let authToken: string;
  let userId: string;
  let propertyId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.unit.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user and get token
    const user = await prisma.user.create({
      data: {
        email: 'units@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        firstName: 'Units',
        lastName: 'Manager',
        role: 'PROPERTY_MANAGER'
      }
    });
    userId = user.id;

    // Create test property
    const property = await prisma.property.create({
      data: {
        name: 'Test Property for Units',
        address: '123 Unit Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA',
        propertyType: 'APARTMENT',
        totalUnits: 10,
        ownerId: userId,
        managerId: userId
      }
    });
    propertyId = property.id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'units@example.com',
        password: 'password'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/units', () => {
    it('should create a new unit', async () => {
      const response = await request(app)
        .post('/api/units')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          unitNumber: 'A101',
          propertyId: propertyId,
          bedrooms: 1,
          bathrooms: 1,
          rent: 1200,
          size: 750
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.unitNumber).toBe('A101');
      expect(response.body.propertyId).toBe(propertyId);
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/api/units')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          unitNumber: 'A102'
          // Missing propertyId and other required fields
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/units', () => {
    beforeEach(async () => {
      await prisma.unit.create({
        data: {
          unitNumber: 'A201',
          propertyId: propertyId,
          bedrooms: 2,
          bathrooms: 2,
          rent: 1800,
          size: 1100
        }
      });
    });

    it('should get all units', async () => {
      const response = await request(app)
        .get('/api/units')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter units by property', async () => {
      const response = await request(app)
        .get('/api/units')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ propertyId });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((unit: any) => {
        expect(unit.propertyId).toBe(propertyId);
      });
    });
  });

  describe('GET /api/units/:id', () => {
    let unitId: string;

    beforeEach(async () => {
      const unit = await prisma.unit.create({
        data: {
          unitNumber: 'A301',
          propertyId: propertyId,
          bedrooms: 0,
          bathrooms: 1,
          rent: 900,
          size: 500
        }
      });
      unitId = unit.id;
    });

    it('should get a specific unit', async () => {
      const response = await request(app)
        .get(`/api/units/${unitId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(unitId);
      expect(response.body.unitNumber).toBe('A301');
    });

    it('should return 404 for non-existent unit', async () => {
      const response = await request(app)
        .get('/api/units/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/units/:id', () => {
    let unitId: string;

    beforeEach(async () => {
      const unit = await prisma.unit.create({
        data: {
          unitNumber: 'A401',
          propertyId: propertyId,
          bedrooms: 1,
          bathrooms: 1,
          rent: 1100,
          size: 700
        }
      });
      unitId = unit.id;
    });

    it('should update an existing unit', async () => {
      const response = await request(app)
        .put(`/api/units/${unitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          monthlyRent: 1300,
          isOccupied: true
        });

      expect(response.status).toBe(200);
      expect(response.body.monthlyRent).toBe(1300);
      expect(response.body.isOccupied).toBe(true);
    });

    it('should fail to update non-existent unit', async () => {
      const response = await request(app)
        .put('/api/units/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          monthlyRent: 1300
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/units/:id', () => {
    let unitId: string;

    beforeEach(async () => {
      const unit = await prisma.unit.create({
        data: {
          unitNumber: 'A501',
          propertyId: propertyId,
          bedrooms: 3,
          bathrooms: 2,
          rent: 2000,
          size: 1200
        }
      });
      unitId = unit.id;
    });

    it('should delete an existing unit', async () => {
      const response = await request(app)
        .delete(`/api/units/${unitId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
    });

    it('should fail to delete non-existent unit', async () => {
      const response = await request(app)
        .delete('/api/units/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});