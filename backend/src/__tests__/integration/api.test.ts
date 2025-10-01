import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../lib/prisma';

describe('API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let propertyId: string;

  beforeAll(async () => {
    // Setup test data
  });

  afterAll(async () => {
    // Cleanup
    await prisma.$disconnect();
  });

  describe('Authentication', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'Test123!@#',
            name: 'Test User',
            role: 'MANAGER',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toHaveProperty('id');
        expect(response.body.data.user.email).toBe('test@example.com');
        expect(response.body.data).toHaveProperty('tokens');

        userId = response.body.data.user.id;
        authToken = response.body.data.tokens.accessToken;
      });

      it('should reject duplicate email', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com',
            password: 'Test123!@#',
            name: 'Test User 2',
            role: 'MANAGER',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });

      it('should reject weak password', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test2@example.com',
            password: '123',
            name: 'Test User 2',
            role: 'MANAGER',
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'Test123!@#',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('tokens');
        expect(response.body.data.tokens).toHaveProperty('accessToken');
        expect(response.body.data.tokens).toHaveProperty('refreshToken');
      });

      it('should reject invalid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });

      it('should reject non-existent user', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'Test123!@#',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/auth/me', () => {
      it('should get current user with valid token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(userId);
        expect(response.body.data.email).toBe('test@example.com');
      });

      it('should reject without token', async () => {
        const response = await request(app).get('/api/auth/me');

        expect(response.status).toBe(401);
      });

      it('should reject with invalid token', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid_token');

        expect(response.status).toBe(401);
      });
    });
  });

  describe('Properties', () => {
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
            type: 'APARTMENT',
            units: 10,
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data.name).toBe('Test Property');

        propertyId = response.body.data.id;
      });

      it('should reject without authentication', async () => {
        const response = await request(app)
          .post('/api/properties')
          .send({
            name: 'Test Property',
            address: '123 Test St',
          });

        expect(response.status).toBe(401);
      });

      it('should reject with missing required fields', async () => {
        const response = await request(app)
          .post('/api/properties')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Test Property',
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/properties', () => {
      it('should get properties list', async () => {
        const response = await request(app)
          .get('/api/properties')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/properties?page=1&limit=5')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeLessThanOrEqual(5);
      });

      it('should support search', async () => {
        const response = await request(app)
          .get('/api/properties?search=Test')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('GET /api/properties/:id', () => {
      it('should get property by id', async () => {
        const response = await request(app)
          .get(`/api/properties/${propertyId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(propertyId);
      });

      it('should return 404 for non-existent property', async () => {
        const response = await request(app)
          .get('/api/properties/nonexistent-id')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(404);
      });
    });

    describe('PUT /api/properties/:id', () => {
      it('should update property', async () => {
        const response = await request(app)
          .put(`/api/properties/${propertyId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Updated Property Name',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Updated Property Name');
      });

      it('should reject unauthorized update', async () => {
        const response = await request(app)
          .put(`/api/properties/${propertyId}`)
          .send({
            name: 'Updated Name',
          });

        expect(response.status).toBe(401);
      });
    });
  });

  describe('Maintenance', () => {
    let maintenanceId: string;

    describe('POST /api/maintenance', () => {
      it('should create maintenance request', async () => {
        const response = await request(app)
          .post('/api/maintenance')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Test Maintenance',
            description: 'Test description',
            priority: 'HIGH',
            category: 'PLUMBING',
            propertyId,
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');

        maintenanceId = response.body.data.id;
      });
    });

    describe('GET /api/maintenance', () => {
      it('should get maintenance requests', async () => {
        const response = await request(app)
          .get('/api/maintenance')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should filter by status', async () => {
        const response = await request(app)
          .get('/api/maintenance?status=PENDING')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('PATCH /api/maintenance/:id/status', () => {
      it('should update maintenance status', async () => {
        const response = await request(app)
          .patch(`/api/maintenance/${maintenanceId}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            status: 'IN_PROGRESS',
          });

        expect(response.status).toBe(200);
        expect(response.body.data.status).toBe('IN_PROGRESS');
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const requests = [];
      
      // Make 6 requests (limit is 5)
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrongpassword',
            })
        );
      }

      const responses = await Promise.all(requests);
      const lastResponse = responses[responses.length - 1];

      expect(lastResponse.status).toBe(429);
      expect(lastResponse.headers).toHaveProperty('x-ratelimit-limit');
      expect(lastResponse.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app).get('/api/health');

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });
});
