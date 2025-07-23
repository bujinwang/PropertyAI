import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Units Endpoints', () => {
  let authToken: string;
  let userId: string;
  let propertyId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'units@example.com',
        password: 'password123',
        firstName: 'Units',
        lastName: 'Manager',
        role: 'PROPERTY_MANAGER'
      }
    });
    userId = user.id;
    authToken = jwt.sign({ id: userId, role: 'PROPERTY_MANAGER' }, process.env.JWT_SECRET || 'secret');

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
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.unitNumber).toBe('A101');
    });
  });

  describe('GET /api/units', () => {
    it('should get all units', async () => {
      const response = await request(app)
        .get('/api/units')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/units/:id', () => {
    it('should get a specific unit', async () => {
        const unit = await prisma.unit.create({ data: { unitNumber: 'A301', propertyId } });
        const response = await request(app)
            .get(`/api/units/${unit.id}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(unit.id);
    });

    it('should return 404 for non-existent unit', async () => {
      const response = await request(app)
        .get('/api/units/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/units/:id', () => {
    it('should update an existing unit', async () => {
        const unit = await prisma.unit.create({ data: { unitNumber: 'A401', propertyId } });
        const response = await request(app)
            .put(`/api/units/${unit.id}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
            monthlyRent: 1300,
            isOccupied: true
            });

        expect(response.status).toBe(200);
        expect(response.body.data.monthlyRent).toBe(1300);
    });
  });

  describe('DELETE /api/units/:id', () => {
    it('should delete an existing unit', async () => {
        const unit = await prisma.unit.create({ data: { unitNumber: 'A501', propertyId } });
        const response = await request(app)
            .delete(`/api/units/${unit.id}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
    });
  });
});