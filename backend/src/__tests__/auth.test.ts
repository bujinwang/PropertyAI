import http from 'http';
import request from 'supertest';
import app from '../app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// One listener for the whole file. Passing the app to supertest makes it call
// `app.listen(0)` and close the listener again on every request, so requests
// can race the previous close (spurious 404 / socket hang up). Binding once and
// passing the server keeps every request on the real Express stack.
let server: http.Server;

describe('Authentication Endpoints', () => {
  let authToken: string;

  beforeAll(async () => {
    server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    // Idempotent setup: clear rows this suite owns so a previous (or aborted)
    // run cannot trip the unique-email constraint below.
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'auth-test@example.com',
            'register@example.com',
            'escalation-test@example.com',
            'unknown-role@example.com',
            'legit-role@example.com',
          ],
        },
      },
    });

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
      const response = await request(server)
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

    // SECURITY REGRESSION: public, unauthenticated signup must not be a path to
    // privilege escalation. An attacker previously could self-register as ADMIN.
    it('should reject self-assignment of the ADMIN role and create no account', async () => {
      const email = 'escalation-test@example.com';

      const response = await request(server)
        .post('/api/auth/register')
        .send({
          email,
          password: 'password123',
          firstName: 'Esc',
          lastName: 'Test',
          role: 'ADMIN'
        });

      expect(response.status).toBe(400);

      const created = await prisma.user.findUnique({ where: { email } });
      expect(created).toBeNull();
    });

    it('should reject an unknown role instead of coercing it', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          email: 'unknown-role@example.com',
          password: 'password123',
          firstName: 'Bad',
          lastName: 'Role',
          role: 'SUPERUSER'
        });

      expect(response.status).toBe(400);
    });

    it('should allow a legitimate self-serve role', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send({
          email: 'legit-role@example.com',
          password: 'password123',
          firstName: 'Legit',
          lastName: 'Role',
          role: 'PROPERTY_MANAGER'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.role).toBe('PROPERTY_MANAGER');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          // Must match the fixture created in beforeAll. This said
          // 'auth@example.com' while the user was created as
          // 'auth-test@example.com', so the lookup always missed and the test
          // asserted 200 against a guaranteed 401.
          email: 'auth-test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('token');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('email');
    });
  });

  afterAll(async () => {
    // Keep the suite re-runnable: drop the users this file creates so a second
    // run does not hit the unique-email constraint.
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'auth-test@example.com',
            'register@example.com',
            'escalation-test@example.com',
            'unknown-role@example.com',
            'legit-role@example.com',
          ],
        },
      },
    });
    await prisma.$disconnect();
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
