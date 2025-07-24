import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Properties Endpoints', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
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
      const response = await request(app)
        .get('/api/properties')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});