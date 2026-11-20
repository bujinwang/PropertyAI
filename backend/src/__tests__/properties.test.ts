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

describe('Properties Endpoints', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    // Start from a clean database. This suite hardcodes 'properties@example.com'
    // below, so without a reset the second run collides with the row the first
    // run left behind and fails with a unique-constraint 500 before any
    // assertion executes. Reset in beforeAll (not afterAll) so the suite also
    // does not inherit rows a previous, unrelated suite left in the same DB.
    // TRUNCATE ... CASCADE — see src/__tests__/testDb.ts for why ordered
    // deleteMany() cannot work against this schema's 37 User foreign keys.
    await resetDatabase(prisma);

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

  describe('GET /api/properties', () => {
    it('should get all properties', async () => {
      const response = await request(server)
        .get('/api/properties')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  // The units suite already exercises the shared adapter end-to-end, but it
  // goes through `unitRoutes`. These cases prove the OTHER router actually
  // wires all four verbs to that adapter — a 200 on GET alone would still be
  // green if POST/PUT/DELETE had been left aliased to the old 410 stub.
  describe('Restored CRUD /api/properties', () => {
    let createdId: string;

    const newProperty = {
      title: 'Restored CRUD Property',
      address: '9 Crud Way',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      propertyType: 'HOUSE',
      rent: 1800,
    };

    it('should create a property (POST) with server-owned ids', async () => {
      const response = await request(server)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...newProperty,
          managerId: 'caller-supplied',
          ownerId: 'caller-supplied',
          createdById: 'caller-supplied',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.managerId).toBe(userId);
      expect(response.body.data.ownerId).toBe(userId);
      expect(response.body.data.createdById).toBe(userId);
      createdId = response.body.data.id;
    });

    it('should read the created property (GET /:id)', async () => {
      const response = await request(server)
        .get(`/api/properties/${createdId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(createdId);
      expect(response.body.data.title).toBe(newProperty.title);
    });

    it('should update the property (PUT /:id) without moving ownership', async () => {
      // A valid user id, not a garbage string: `rentalService.updateRental`
      // spreads its payload straight into Prisma (rentalService.ts:475-482), so
      // only the adapter's whitelist stops these fields being applied. With a
      // bogus id the FK would 500 and the test would "pass" for the wrong
      // reason; with a real victim id the assertions below are load-bearing.
      const victim = await prisma.user.create({
        data: {
          email: 'victim-put-ownership@example.com',
          password: 'not-a-real-hash',
          firstName: 'Victim',
          lastName: 'Put',
          role: 'PROPERTY_MANAGER'
        }
      });

      const response = await request(server)
        .put(`/api/properties/${createdId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated CRUD Property',
          // Not in the update whitelist: an attempt to move ownership must be
          // dropped, not applied.
          managerId: victim.id,
          ownerId: victim.id,
          createdById: victim.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated CRUD Property');
      expect(response.body.data.managerId).toBe(userId);
      expect(response.body.data.ownerId).toBe(userId);
      expect(response.body.data.createdById).toBe(userId);
      expect(response.body.data.managerId).not.toBe(victim.id);
      expect(response.body.data.ownerId).not.toBe(victim.id);
      expect(response.body.data.createdById).not.toBe(victim.id);
    });

    it('should delete the property (DELETE /:id)', async () => {
      const response = await request(server)
        .delete(`/api/properties/${createdId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const after = await request(server)
        .get(`/api/properties/${createdId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(after.status).toBe(404);
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});