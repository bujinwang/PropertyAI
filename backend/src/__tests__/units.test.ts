import http from 'http';
import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { resetDatabase } from './testDb';

const prisma = new PrismaClient();

// One listener for the whole file. Passing the app to supertest makes it call
// `app.listen(0)` and close the listener again on every request, so requests
// can race the previous close (spurious 404 / socket hang up). Binding once and
// passing the server keeps every request on the real Express stack.
let server: http.Server;

describe('Units Endpoints', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    // Start from a clean database. This suite hardcodes 'units-unique@example.com'
    // below, so without a reset the second run collides with the row the first
    // run left behind and fails with a unique-constraint 500 before any
    // assertion executes. Reset in beforeAll (not afterAll) so the suite also
    // does not inherit rows a previous, unrelated suite left in the same DB.
    // TRUNCATE ... CASCADE — see src/__tests__/testDb.ts for why ordered
    // deleteMany() cannot work against this schema's 37 User foreign keys.
    await resetDatabase(prisma);

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
      const response = await request(server)
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
      const response = await request(server)
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
        const response = await request(server)
            .get(`/api/units/${rental.id}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(rental.id);
    });

    it('should return 404 for non-existent rental unit', async () => {
      const response = await request(server)
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
        const response = await request(server)
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
        const response = await request(server)
            .delete(`/api/units/${rental.id}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});