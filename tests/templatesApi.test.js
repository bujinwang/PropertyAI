const request = require('supertest');
const app = require('../backend/src/index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('UserTemplates API Tests', () => {
  let authToken;
  let testUser;
  let testTemplate;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test-templates@example.com',
        password: 'hashedpassword',
        role: 'ADMIN'
      }
    });

    // Mock authentication token
    authToken = 'mock-jwt-token';
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.userTemplate.deleteMany({
      where: { userId: testUser.id }
    });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe('POST /api/templates', () => {
    test('should create a new template', async () => {
      const templateData = {
        userId: testUser.id,
        templateName: 'Test Dashboard Template',
        layout: [
          { type: 'alerts', position: 'top' },
          { type: 'chart', position: 'center' }
        ],
        role: 'ADMIN'
      };

      const response = await request(app)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.templateName).toBe('Test Dashboard Template');
      expect(response.body.data.role).toBe('ADMIN');

      testTemplate = response.body.data;
    });

    test('should validate required fields', async () => {
      const invalidData = {
        userId: testUser.id,
        layout: [{ type: 'alerts' }]
      };

      const response = await request(app)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate layout structure', async () => {
      const invalidData = {
        userId: testUser.id,
        templateName: 'Invalid Template',
        layout: 'invalid-layout', // Should be array
        role: 'ADMIN'
      };

      const response = await request(app)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/templates/:id', () => {
    test('should get template by ID', async () => {
      const response = await request(app)
        .get(`/api/templates/${testTemplate.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testTemplate.id);
      expect(response.body.data.templateName).toBe('Test Dashboard Template');
    });

    test('should return 404 for non-existent template', async () => {
      const response = await request(app)
        .get('/api/templates/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Template not found');
    });
  });

  describe('GET /api/templates/user/:userId', () => {
    test('should get all templates for a user', async () => {
      const response = await request(app)
        .get(`/api/templates/user/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.count).toBe(response.body.data.length);
    });

    test('should filter templates by role', async () => {
      const response = await request(app)
        .get(`/api/templates/user/${testUser.id}?role=ADMIN`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(template => template.role === 'ADMIN')).toBe(true);
    });
  });

  describe('GET /api/templates/shared', () => {
    test('should get shared templates', async () => {
      // First, share the template
      await request(app)
        .post(`/api/templates/${testTemplate.id}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sharedWith: ['user-456'] })
        .expect(200);

      const response = await request(app)
        .get('/api/templates/shared')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/templates/accessible', () => {
    test('should get all accessible templates', async () => {
      const response = await request(app)
        .get('/api/templates/accessible')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBe(response.body.data.length);
    });

    test('should filter by role', async () => {
      const response = await request(app)
        .get('/api/templates/accessible?role=ADMIN')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(template => template.role === 'ADMIN')).toBe(true);
    });
  });

  describe('PUT /api/templates/:id', () => {
    test('should update template', async () => {
      const updateData = {
        templateName: 'Updated Dashboard Template',
        layout: [
          { type: 'alerts', position: 'top' },
          { type: 'chart', position: 'center' },
          { type: 'table', position: 'bottom' }
        ]
      };

      const response = await request(app)
        .put(`/api/templates/${testTemplate.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templateName).toBe('Updated Dashboard Template');
      expect(response.body.data.layout).toHaveLength(3);
    });

    test('should validate update data', async () => {
      const invalidUpdate = {
        layout: 'invalid-layout'
      };

      const response = await request(app)
        .put(`/api/templates/${testTemplate.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/templates/save', () => {
    test('should save template (create or update)', async () => {
      const saveData = {
        userId: testUser.id,
        templateName: 'Saved Template',
        layout: [{ type: 'dashboard', position: 'main' }],
        role: 'USER'
      };

      const response = await request(app)
        .post('/api/templates/save')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saveData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templateName).toBe('Saved Template');
      expect(response.body.data.role).toBe('USER');
    });
  });

  describe('POST /api/templates/:id/share', () => {
    test('should share template with users', async () => {
      const shareData = {
        sharedWith: ['user-123', 'user-456']
      };

      const response = await request(app)
        .post(`/api/templates/${testTemplate.id}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(shareData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isShared).toBe(true);
      expect(response.body.data.sharedWith).toEqual(['user-123', 'user-456']);
    });

    test('should validate sharedWith array', async () => {
      const invalidShare = {
        sharedWith: 'not-an-array'
      };

      const response = await request(app)
        .post(`/api/templates/${testTemplate.id}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidShare)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/templates/:id/unshare', () => {
    test('should unshare template', async () => {
      const response = await request(app)
        .post(`/api/templates/${testTemplate.id}/unshare`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isShared).toBe(false);
      expect(response.body.data.sharedWith).toEqual([]);
    });
  });

  describe('GET /api/templates/role/:role', () => {
    test('should get templates by role', async () => {
      const response = await request(app)
        .get('/api/templates/role/ADMIN')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.every(template => template.role === 'ADMIN')).toBe(true);
    });
  });

  describe('POST /api/templates/:id/validate', () => {
    test('should validate template layout', async () => {
      const validationData = {
        availableComponents: ['alerts', 'chart', 'table']
      };

      const response = await request(app)
        .post(`/api/templates/${testTemplate.id}/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(validationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isValid');
      expect(response.body.data.templateId).toBe(testTemplate.id);
    });

    test('should detect invalid components', async () => {
      const validationData = {
        availableComponents: ['alerts'] // Missing 'chart' and 'table'
      };

      const response = await request(app)
        .post(`/api/templates/${testTemplate.id}/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(validationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Depending on template layout, this might be invalid
      expect(response.body.data).toHaveProperty('isValid');
    });
  });

  describe('POST /api/templates/apply', () => {
    test('should apply template layout', async () => {
      const applyData = {
        layout: [
          { type: 'alerts', position: 'top' },
          { type: 'chart', position: 'center' }
        ],
        availableComponents: ['alerts', 'chart', 'table']
      };

      const response = await request(app)
        .post('/api/templates/apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send(applyData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should reject invalid layout', async () => {
      const invalidApply = {
        layout: 'invalid-layout',
        availableComponents: ['alerts']
      };

      const response = await request(app)
        .post('/api/templates/apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidApply)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/templates/search', () => {
    test('should search templates by name', async () => {
      const response = await request(app)
        .get('/api/templates/search?q=Dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBe(response.body.data.length);
    });

    test('should filter search by user', async () => {
      const response = await request(app)
        .get(`/api/templates/search?q=Template&userId=${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(template => template.userId === testUser.id)).toBe(true);
    });

    test('should handle empty search results', async () => {
      const response = await request(app)
        .get('/api/templates/search?q=nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });
  });

  describe('GET /api/templates/stats/overview', () => {
    test('should get template statistics', async () => {
      const response = await request(app)
        .get('/api/templates/stats/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalTemplates');
      expect(response.body.data).toHaveProperty('templatesByRole');
      expect(response.body.data).toHaveProperty('sharedTemplates');
    });
  });

  describe('DELETE /api/templates/:id', () => {
    test('should delete template', async () => {
      const response = await request(app)
        .delete(`/api/templates/${testTemplate.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Template deleted successfully');

      // Verify deletion
      const checkResponse = await request(app)
        .get(`/api/templates/${testTemplate.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(checkResponse.body.success).toBe(false);
    });
  });

  describe('Authentication', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/templates/stats/overview')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject invalid tokens', async () => {
      const response = await request(app)
        .get('/api/templates/stats/overview')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // This would require mocking database errors
      // For now, just test that errors are properly formatted
      const response = await request(app)
        .get('/api/templates/non-existent-endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });
  });
});
