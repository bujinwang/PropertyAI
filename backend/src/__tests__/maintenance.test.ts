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

describe('Maintenance Endpoints', () => {
  let authToken: string;
  let userId: string;
  let rentalId: string;

  beforeAll(async () => {
    server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    // Start from a clean database. This suite hardcodes 'maintenance@example.com'
    // below, so without a reset the second run collides with the row the first
    // run left behind and fails with a unique-constraint 500 before any
    // assertion executes. Reset in beforeAll (not afterAll) so the suite also
    // does not inherit rows a previous, unrelated suite left in the same DB.
    // TRUNCATE ... CASCADE — see src/__tests__/testDb.ts for why ordered
    // deleteMany() cannot work against this schema's 37 User foreign keys.
    await resetDatabase(prisma);

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

    const rental = await prisma.rental.create({
      data: {
        title: 'Test Property Unit M101',
        address: '123 Maintenance Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA',
        propertyType: 'APARTMENT',
        unitNumber: 'M101',
        bedrooms: 2,
        bathrooms: 1,
        rent: 1500,
        deposit: 1500,
        ownerId: userId,
        managerId: userId,
        createdById: userId,
        status: 'ACTIVE',
        isAvailable: true,
        slug: 'test-maintenance-slug',
      }
    });
    rentalId = rental.id;
  });

  describe('POST /api/maintenance', () => {
    it('should create a new maintenance request', async () => {
      const response = await request(server)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Leaky faucet',
          description: 'The kitchen faucet is dripping.',
          rentalId: rentalId, // Use rentalId instead of propertyId and unitId
          priority: 'HIGH',
          requestedById: userId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
    });
  });

  describe('GET /api/maintenance', () => {
    it('should get all maintenance requests', async () => {
      const response = await request(server)
        .get('/api/maintenance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});