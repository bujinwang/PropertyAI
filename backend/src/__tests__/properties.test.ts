import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Properties Endpoints', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'properties@example.com',
        password: 'password123',
        firstName: 'Properties',
        lastName: 'Manager',
        role: 'PROPERTY_MANAGER'
      }
    });
    userId = user.id;
    authToken = jwt.sign({ id: userId, role: 'PROPERTY_MANAGER' }, process.env.JWT_SECRET || 'secret');
  });

  describe('POST /api/properties', () => {
    it('should create a new property', async () => {
      const response = await request(app)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Property',
          address: '123 Test St',
          city: 'Testville',
          state: 'TS',
          zipCode: '12345',
          country: 'USA',
          propertyType: 'APARTMENT',
          totalUnits: 10,
          ownerId: userId,
          managerId: userId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Test Property');
    });
  });

  describe('GET /api/properties', () => {
    it('should get all properties', async () => {
      const response = await request(app)
        .get('/api/properties')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/properties/:id', () => {
    it('should get a specific property', async () => {
        const property = await prisma.property.create({ data: { name: 'Single Property', ownerId: userId, managerId: userId, address: '123 Test St', city: 'Testville', state: 'TS', zipCode: '12345', country: 'USA', propertyType: 'APARTMENT', totalUnits: 10 } });
        const response = await request(app)
            .get(`/api/properties/${property.id}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(property.id);
    });

    it('should return 404 for non-existent property', async () => {
      const response = await request(app)
        .get('/api/properties/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/properties/:id', () => {
    it('should update an existing property', async () => {
        const property = await prisma.property.create({ data: { name: 'Updatable Property', ownerId: userId, managerId: userId, address: '123 Test St', city: 'Testville', state: 'TS', zipCode: '12345', country: 'USA', propertyType: 'APARTMENT', totalUnits: 10 } });
        const response = await request(app)
            .put(`/api/properties/${property.id}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Updated Property Name',
                totalUnits: 12,
            });

        expect(response.status).toBe(200);
        expect(response.body.data.name).toBe('Updated Property Name');
    });
  });

  describe('DELETE /api/properties/:id', () => {
    it('should delete an existing property', async () => {
        const property = await prisma.property.create({ data: { name: 'Deletable Property', ownerId: userId, managerId: userId, address: '123 Test St', city: 'Testville', state: 'TS', zipCode: '12345', country: 'USA', propertyType: 'APARTMENT', totalUnits: 10 } });
        const response = await request(app)
            .delete(`/api/properties/${property.id}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(204);
    });
  });
});