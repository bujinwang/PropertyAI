import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Maintenance Endpoints', () => {
  let authToken: string;
  let userId: string;
  let propertyId: string;
  let unitId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'maintenance@example.com',
        password: 'password123',
        firstName: 'Maintenance',
        lastName: 'Manager',
        role: 'PROPERTY_MANAGER'
      }
    });
    userId = user.id;
    authToken = jwt.sign({ id: userId, role: 'PROPERTY_MANAGER' }, process.env.JWT_SECRET || 'secret');

    const property = await prisma.property.create({
      data: {
        name: 'Test Property for Maintenance',
        address: '123 Maintenance Test St',
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

    const unit = await prisma.unit.create({
        data: {
            unitNumber: 'M101',
            propertyId: propertyId,
        }
    });
    unitId = unit.id;
  });

  describe('POST /api/maintenance', () => {
    it('should create a new maintenance request', async () => {
      const response = await request(app)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Leaky faucet',
          description: 'The kitchen faucet is dripping.',
          propertyId: propertyId,
          unitId: unitId,
          priority: 'HIGH',
          requestedById: userId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
    });
  });

  describe('GET /api/maintenance', () => {
    it('should get all maintenance requests', async () => {
      const response = await request(app)
        .get('/api/maintenance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});