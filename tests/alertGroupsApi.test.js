const request = require('supertest');
const app = require('../backend/src/index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('AlertGroups API Tests', () => {
  let authToken;
  let testUser;
  let testProperty;
  let testAlertGroup;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test-alerts@example.com',
        password: 'hashedpassword',
        role: 'ADMIN'
      }
    });

    // Create test property
    testProperty = await prisma.property.create({
      data: {
        title: 'Test Property for Alerts',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        price: 250000,
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 1500,
        propertyType: 'HOUSE',
        status: 'ACTIVE',
        ownerId: testUser.id
      }
    });

    // Mock authentication token (in real tests, you'd get this from login)
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.alertGroup.deleteMany({
      where: { propertyId: testProperty.id }
    });
    await prisma.property.delete({ where: { id: testProperty.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe('POST /api/alert-groups', () => {
    test('should create a new alert group', async () => {
      const alertGroupData = {
        groupType: 'MAINTENANCE',
        priority: 'HIGH',
        propertyId: testProperty.id,
        alertCount: 3
      };

      const response = await request(app)
        .post('/api/alert-groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(alertGroupData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.groupType).toBe('MAINTENANCE');
      expect(response.body.data.priority).toBe('HIGH');
      expect(response.body.data.alertCount).toBe(3);

      testAlertGroup = response.body.data;
    });

    test('should validate required fields', async () => {
      const invalidData = {
        priority: 'HIGH',
        propertyId: testProperty.id
      };

      const response = await request(app)
        .post('/api/alert-groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate enum values', async () => {
      const invalidData = {
        groupType: 'INVALID_TYPE',
        priority: 'HIGH',
        propertyId: testProperty.id
      };

      const response = await request(app)
        .post('/api/alert-groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/alert-groups/:id', () => {
    test('should get alert group by ID', async () => {
      const response = await request(app)
        .get(`/api/alert-groups/${testAlertGroup.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testAlertGroup.id);
      expect(response.body.data.groupType).toBe('MAINTENANCE');
    });

    test('should return 404 for non-existent alert group', async () => {
      const response = await request(app)
        .get('/api/alert-groups/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Alert group not found');
    });
  });

  describe('GET /api/alert-groups/property/:propertyId', () => {
    test('should get all alert groups for a property', async () => {
      const response = await request(app)
        .get(`/api/alert-groups/property/${testProperty.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.count).toBe(response.body.data.length);
    });

    test('should return empty array for property with no alerts', async () => {
      const emptyProperty = await prisma.property.create({
        data: {
          title: 'Empty Property',
          address: '456 Empty St',
          city: 'Empty City',
          state: 'ES',
          zipCode: '67890',
          price: 200000,
          bedrooms: 2,
          bathrooms: 1,
          squareFeet: 1000,
          propertyType: 'APARTMENT',
          status: 'ACTIVE',
          ownerId: testUser.id
        }
      });

      const response = await request(app)
        .get(`/api/alert-groups/property/${emptyProperty.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
      expect(response.body.count).toBe(0);

      await prisma.property.delete({ where: { id: emptyProperty.id } });
    });
  });

  describe('PUT /api/alert-groups/:id', () => {
    test('should update alert group', async () => {
      const updateData = {
        priority: 'CRITICAL',
        alertCount: 5
      };

      const response = await request(app)
        .put(`/api/alert-groups/${testAlertGroup.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.priority).toBe('CRITICAL');
      expect(response.body.data.alertCount).toBe(5);
    });

    test('should validate update data', async () => {
      const invalidUpdate = {
        priority: 'INVALID_PRIORITY'
      };

      const response = await request(app)
        .put(`/api/alert-groups/${testAlertGroup.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/alert-groups/:id/increment', () => {
    test('should increment alert count', async () => {
      const initialCount = testAlertGroup.alertCount;
      const incrementBy = 2;

      const response = await request(app)
        .patch(`/api/alert-groups/${testAlertGroup.id}/increment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ incrementBy })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alertCount).toBe(initialCount + incrementBy);
    });

    test('should increment by 1 when no incrementBy provided', async () => {
      const initialCount = testAlertGroup.alertCount;

      const response = await request(app)
        .patch(`/api/alert-groups/${testAlertGroup.id}/increment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alertCount).toBe(initialCount + 1);
    });
  });

  describe('PATCH /api/alert-groups/:id/decrement', () => {
    test('should decrement alert count', async () => {
      const initialCount = testAlertGroup.alertCount;
      const decrementBy = 1;

      const response = await request(app)
        .patch(`/api/alert-groups/${testAlertGroup.id}/decrement`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ decrementBy })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alertCount).toBe(initialCount - decrementBy);
    });
  });

  describe('GET /api/alert-groups/stats/overview', () => {
    test('should get alert groups statistics', async () => {
      const response = await request(app)
        .get('/api/alert-groups/stats/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalGroups');
      expect(response.body.data).toHaveProperty('groupsByType');
      expect(response.body.data).toHaveProperty('groupsByPriority');
    });
  });

  describe('GET /api/alert-groups/high-priority', () => {
    test('should get high priority alert groups', async () => {
      const response = await request(app)
        .get('/api/alert-groups/high-priority?limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBe(response.body.data.length);
    });

    test('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/alert-groups/high-priority?limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('DELETE /api/alert-groups/:id', () => {
    test('should delete alert group', async () => {
      const response = await request(app)
        .delete(`/api/alert-groups/${testAlertGroup.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Alert group deleted successfully');

      // Verify deletion
      const checkResponse = await request(app)
        .get(`/api/alert-groups/${testAlertGroup.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(checkResponse.body.success).toBe(false);
    });
  });

  describe('Authentication', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/alert-groups/stats/overview')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/alert-groups/stats/overview')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
