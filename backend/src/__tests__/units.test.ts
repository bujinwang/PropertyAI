import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Units Endpoints', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'units-unique@example.com',
        password: 'password123',
        firstName: 'Units',
        lastName: 'Manager',
        role: 'PROPERTY_MANAGER'
      }
    });
    userId = user.id;
    authToken = jwt.sign({ id: userId, role: 'PROPERTY_MANAGER' }, process.env.JWT_SECRET || 'secret');
  });

  describe('POST /api/units', () => {
    it('should create a new rental unit', async () => {
      const response = await request(app)
        .post('/api/units')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Property Unit A101',
          address: '123 Unit Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'USA',
          propertyType: 'APARTMENT',
          unitNumber: 'A101',
          bedrooms: 1,
          bathrooms: 1,
          rent: 1200,
          deposit: 1200,
          managerId: userId,
          ownerId: userId,
          createdById: userId,
          status: 'ACTIVE',
          isAvailable: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.unitNumber).toBe('A101');
    });
  });

  describe('GET /api/units', () => {
    it('should get all rental units', async () => {
      const response = await request(app)
        .get('/api/units')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/units/:id', () => {
    it('should get a specific rental unit', async () => {
        const rental = await prisma.rental.create({ 
          data: {
            title: 'Test Property Unit A301',
            address: '123 Unit Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'USA',
            propertyType: 'APARTMENT',
            unitNumber: 'A301',
            bedrooms: 1,
            bathrooms: 1,
            rent: 1200,
            deposit: 1200,
            managerId: userId,
            ownerId: userId,
            createdById: userId,
            status: 'ACTIVE',
            isAvailable: true,
            slug: 'test-unit-slug-301',
          }
        });
        const response = await request(app)
            .get(`/api/units/${rental.id}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(rental.id);
    });

    it('should return 404 for non-existent rental unit', async () => {
      const response = await request(app)
        .get('/api/units/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/units/:id', () => {
    it('should update an existing rental unit', async () => {
        const rental = await prisma.rental.create({
          data: {
            title: 'Test Property Unit A401',
            address: '123 Unit Test St',
            slug: 'test-unit-slug-401',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'USA',
            propertyType: 'APARTMENT',
            unitNumber: 'A401',
            bedrooms: 1,
            bathrooms: 1,
            rent: 1200,
            deposit: 1200,
            managerId: userId,
            ownerId: userId,
            createdById: userId,
            status: 'ACTIVE',
            isAvailable: true,
        }
        });
        const response = await request(app)
            .put(`/api/units/${rental.id}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              rent: 1300,
              isAvailable: false
            });

        expect(response.status).toBe(200);
        expect(response.body.data.rent).toBe(1300);
    });
  });

  describe('DELETE /api/units/:id', () => {
    it('should delete an existing rental unit', async () => {
        const rental = await prisma.rental.create({ 
          data: {
            title: 'Test Property Unit A501',
            address: '123 Unit Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'USA',
            propertyType: 'APARTMENT',
            unitNumber: 'A501',
            bedrooms: 1,
            bathrooms: 1,
            rent: 1200,
            deposit: 1200,
            managerId: userId,
            ownerId: userId,
            createdById: userId,
            status: 'ACTIVE',
            isAvailable: true,
            slug: 'test-unit-slug-501',
          }
        });
        const response = await request(app)
            .delete(`/api/units/${rental.id}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
    });
  });
});