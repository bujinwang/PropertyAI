import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Authentication Endpoints', () => {
  let authToken: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'auth-test@example.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Auth',
        lastName: 'User',
        role: 'PROPERTY_MANAGER'
      }
    });
    authToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret');
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'register@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('token');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('email');
    });
  });
});
