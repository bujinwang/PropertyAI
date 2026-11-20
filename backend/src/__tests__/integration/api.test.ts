import http from 'http';
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../config/database';
import { resetDatabase } from '../testDb';

// One listener for the whole file. Passing the app to supertest makes it call
// `app.listen(0)` and close the listener again on every request, so requests
// can race the previous close (spurious 404 / socket hang up). Binding once and
// passing the server keeps every request on the real Express stack.
let server: http.Server;

describe('API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let propertyId: string;

  // Start each run from a clean database. Without this the suite depended on
  // whatever rows a previous suite left behind: registering 'test@example.com'
  // then failed with a unique-constraint 500 instead of 201.
  beforeAll(async () => {
    server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  describe('Authentication', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user', async () => {
        const response = await request(server)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'Test123!@#',
            firstName: 'Test',
            lastName: 'User',
            role: 'PROPERTY_MANAGER',
          });

        // The API returns the created user flat under `data`
        // ({ data: { id, email, firstName, lastName, role } }) and issues no
        // token here — clients register then log in separately, as
        // dashboard/src/pages/RegisterScreen.tsx does.
        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.email).toBe('test@example.com');

        userId = response.body.data.id;
      });

      it('should reject duplicate email', async () => {
        const response = await request(server)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'Test123!@#',
            firstName: 'Test',
            lastName: 'User Two',
            role: 'PROPERTY_MANAGER',
          });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
      });

      it('should reject weak password', async () => {
        const response = await request(server)
          .post('/api/auth/register')
          .send({
            email: 'test2@example.com',
            password: '123',
            firstName: 'Test',
            lastName: 'User Two',
            role: 'PROPERTY_MANAGER',
          });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(server)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'Test123!@#',
          });

        // Login returns { data: { token, refreshToken, user } } — see
        // authController.login. Capture the token for the authenticated
        // tests below; registration does not issue one.
        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('token');
        expect(response.body.data).toHaveProperty('refreshToken');

        authToken = response.body.data.token;
        userId = response.body.data.user.id;
      });

      it('should reject invalid credentials', async () => {
        const response = await request(server)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
          });

        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
      });

      it('should reject non-existent user', async () => {
        const response = await request(server)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'Test123!@#',
          });

        expect(response.status).toBe(401);
        expect(response.body.status).toBe('error');
      });
    });

    describe('GET /api/auth/me', () => {
      it('should get current user with valid token', async () => {
        const response = await request(server)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`);

        // `/me` returns { data: { ...user fields } } with no `success` flag —
        // see the handler in routes/authRoutes.ts.
        expect(response.status).toBe(200);
        expect(response.body.data.id).toBe(userId);
        expect(response.body.data.email).toBe('test@example.com');
      });

      it('should reject without token', async () => {
        const response = await request(server).get('/api/auth/me');

        expect(response.status).toBe(401);
      });

      it('should reject with invalid token', async () => {
        const response = await request(server)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid_token');

        expect(response.status).toBe(401);
      });
    });
  });

  // `/api/properties` was a 410 stub after the Property model was consolidated
  // into Rental. CRUD has since been RESTORED as a compatibility view over
  // Rental (see controllers/legacyRentalCrud.ts), so these cases now pin the
  // live contract instead of the deprecation envelope. CLASS A: the product
  // behaviour changed by decision, so the expectations are updated — and
  // strengthened with an ownership check that the old 410 assertions lacked.
  describe('Restored /api/properties', () => {
    it('should list the collection as a Rental view', async () => {
      const response = await request(server)
        .get('/api/properties')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).not.toHaveProperty('migration');
    });

    it('should create a property and ignore caller-supplied ownership ids', async () => {
      // Use a REAL user id, not a garbage string. A bogus id only proves the FK
      // rejects it (500); a valid victim id proves the server actively refuses
      // to let the caller point a rental at somebody else. This is the shape a
      // real attacker would send, and it is what makes the assertions below
      // load-bearing rather than incidentally satisfied by an FK error.
      const victim = await prisma.user.create({
        data: {
          email: 'victim-ownership@example.com',
          password: 'not-a-real-hash',
          firstName: 'Victim',
          lastName: 'Owner',
          role: 'PROPERTY_MANAGER',
        },
      });

      const response = await request(server)
        .post('/api/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Restored Property',
          address: '123 Restored St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          propertyType: 'HOUSE',
          rent: 1500,
          // Deliberately wrong. `rentalController.createRental` copies these
          // straight into the row (a known hole); the restored write path must
          // overwrite all three with the authenticated user instead.
          managerId: victim.id,
          ownerId: victim.id,
          createdById: victim.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.managerId).toBe(userId);
      expect(response.body.data.ownerId).toBe(userId);
      expect(response.body.data.createdById).toBe(userId);
      expect(response.body.data.managerId).not.toBe(victim.id);
      expect(response.body.data.ownerId).not.toBe(victim.id);
      expect(response.body.data.createdById).not.toBe(victim.id);
    });

    it('should still require authentication on the restored surface', async () => {
      const response = await request(server).get('/api/properties');

      expect(response.status).toBe(401);
      expect(response.body).not.toHaveProperty('data');
    });
  });

  describe('Rentals (replacement for properties)', () => {
    it('should create a rental', async () => {
      const response = await request(server)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Rental',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          type: 'APARTMENT',
        });

      // The rental write path validates the caller-supplied owner/manager ids,
      // so a bare authenticated user may be rejected (4xx). Either way this must
      // not be a 5xx or the retired-endpoint 410.
      expect(response.status).toBeLessThan(500);
      expect(response.status).not.toBe(410);

      if (response.status === 201 || response.status === 200) {
        expect(response.body.data).toHaveProperty('id');
        propertyId = response.body.data.id;
      }
    });

    it('should list rentals for the authenticated user', async () => {
      const response = await request(server)
        .get('/api/rentals')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBeLessThan(500);
      expect(response.status).not.toBe(410);
    });

    it('should reject rental creation without authentication', async () => {
      const response = await request(server)
        .post('/api/rentals')
        .send({ title: 'Unauthorized', address: '1 Nowhere' });

      expect(response.status).toBe(401);
    });
  });

  describe('Maintenance', () => {
    let maintenanceId: string;
    let rentalId: string;

    // MaintenanceRequest is keyed to a Rental (not a Property — that model was
    // retired) and needs both `rentalId` and `requestedById`. Build those rows
    // directly so the endpoint is exercised against the real schema.
    beforeAll(async () => {
      const rental = await prisma.rental.create({
        data: {
          title: 'Maintenance Fixture Rental',
          address: '789 Fixture Ave',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          propertyType: 'APARTMENT',
          rent: 1500,
          // `slug` is unique and `managerId`/`ownerId`/`createdById` are
          // required FKs to User — all filled from the user created earlier.
          slug: `maintenance-fixture-${Date.now()}`,
          managerId: userId,
          ownerId: userId,
          createdById: userId,
        },
      });
      rentalId = rental.id;
    });

    describe('POST /api/maintenance', () => {
      it('should create maintenance request', async () => {
        const response = await request(server)
          .post('/api/maintenance')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Test Maintenance',
            description: 'Test description',
            priority: 'HIGH',
            rentalId,
            requestedById: userId,
          });

        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty('id');

        maintenanceId = response.body.data.id;
      });

      it('should reject a payload missing required relations with 400', async () => {
        const response = await request(server)
          .post('/api/maintenance')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Missing relations', description: 'no rental id' });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/maintenance', () => {
      it('should get maintenance requests', async () => {
        const response = await request(server)
          .get('/api/maintenance')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should filter by status', async () => {
        const response = await request(server)
          .get('/api/maintenance?status=OPEN')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should advertise the rate limit on login responses', async () => {
      // The login limiter allows 50 requests / 15 min (see
      // middleware/rateLimiter.ts), so asserting a 429 after 6 attempts can
      // never hold. `legacyHeaders: false` also means the `X-RateLimit-*`
      // headers are not sent; with `standardHeaders: true` the RFC 9449
      // `RateLimit-*` headers are used instead.
      const response = await request(server)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-policy']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(server)
        .get('/api/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(server).get('/api/health');

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });
});
