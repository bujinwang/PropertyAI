import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Properties Endpoints', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.property.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user and get token
    const user = await prisma.user.create({
      data: {
        email: 'property@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        firstName: 'Property',
        lastName: 'Manager',
        role: 'PROPERTY_MANAGER'
      }
    });
    userId = user.id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'property@example.com',
        password: 'password'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/properties', () => {
    it('should create a new property', async () => {
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Property',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA',
          propertyType: 'APARTMENT',
          totalUnits: 10,
          managerId: userId,
          ownerId: userId
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Property');
    });

    it('should fail without authorization', async () => {
      const response = await request(app)
        .post('/api/properties')
        .send({
          name: 'Test Property',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA',
          propertyType: 'APARTMENT',
          totalUnits: 10,
          managerId: userId,
          ownerId: userId
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/properties', () => {
    beforeEach(async () => {
      await prisma.property.create({
        data: {
          name: 'Test Property 1',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA',
          propertyType: 'APARTMENT',
          totalUnits: 5,
          ownerId: userId,
          managerId: userId
        }
      });
    });

    it('should get all properties', async () => {
      const response = await request(app)
        .get('/api/properties')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/properties/:id', () => {
    let propertyId: string;

    beforeEach(async () => {
      const property = await prisma.property.create({
        data: {
          name: 'Single Property',
          address: '456 Test Ave',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA',
          propertyType: 'HOUSE',
          totalUnits: 1,
          ownerId: userId,
          managerId: userId
        }
      });
      propertyId = property.id;
    });

    it('should get a specific property', async () => {
      const response = await request(app)
        .get(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(propertyId);
      expect(response.body.name).toBe('Single Property');
    });

    it('should return 404 for non-existent property', async () => {
      const response = await request(app)
        .get('/api/properties/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/properties/:id', () => {
    let propertyId: string;

    beforeEach(async () => {
      const property = await prisma.property.create({
        data: {
          name: 'Update Property',
          address: '789 Test Blvd',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA',
          propertyType: 'APARTMENT',
          totalUnits: 8,
          ownerId: userId,
          managerId: userId
        }
      });
      propertyId = property.id;
    });

    it('should update an existing property', async () => {
      const response = await request(app)
        .put(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Property Name',
          totalUnits: 12
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Property Name');
      expect(response.body.totalUnits).toBe(12);
    });
  });

  describe('DELETE /api/properties/:id', () => {
    let propertyId: string;

    beforeEach(async () => {
      const property = await prisma.property.create({
        data: {
          name: 'Delete Property',
          address: '999 Test Ln',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA',
          propertyType: 'APARTMENT',
          totalUnits: 3,
          ownerId: userId,
          managerId: userId
        }
      });
      propertyId = property.id;
    });

    it('should delete an existing property', async () => {
      const response = await request(app)
        .delete(`/api/properties/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
    });
  });
});