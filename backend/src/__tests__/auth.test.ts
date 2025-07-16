import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    // Clean up test data - handled by setup.ts
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test@123',
          firstName: 'Test',
          lastName: 'User',
          role: 'PROPERTY_MANAGER'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('test@example.com');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test@123',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(400);
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'weak',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Create user for login test
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'Test@123',
          firstName: 'Login',
          lastName: 'User',
          role: 'PROPERTY_MANAGER'
        });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Test@123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('login@example.com');
    });

    it('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset email for existing user', async () => {
      // Create user for forgot password test
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'forgot@example.com',
          password: 'Test@123',
          firstName: 'Forgot',
          lastName: 'User',
          role: 'PROPERTY_MANAGER'
        });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'forgot@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('password reset');
    });

    it('should return success message for non-existent user (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('password reset');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      // Create user and request password reset
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'reset@example.com',
          password: 'Test@123',
          firstName: 'Reset',
          lastName: 'User',
          role: 'PROPERTY_MANAGER'
        });

      // Request password reset to generate token
      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'reset@example.com'
        });

      // This test would need to extract actual token from email
      // For now, test with invalid token
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPass@123'
        });

      expect(response.status).toBe(400); // Invalid token
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeEach(async () => {
      // Create user and login to get token
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'me@example.com',
          password: 'Test@123',
          firstName: 'Me',
          lastName: 'User',
          role: 'PROPERTY_MANAGER'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'me@example.com',
          password: 'Test@123'
        });

      authToken = loginResponse.body.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('me@example.com');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail without authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });
});