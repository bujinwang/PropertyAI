import http from 'http';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { app } from '../app';
import { prisma } from '../config/database';
import { resetDatabase } from './testDb';

/**
 * `/api/templates` and `/api/ux-review` — ownership and response shape.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Both routers call `router.use(authenticateToken)` and then never look at
 * `req.user` again. Authentication is established; authorization never happens.
 * They are the same class as `/api/manual-review` and `/api/appliances` from the
 * previous pass, found by the same detector (a controller/service that does not
 * read `req.user`, or reads it only to stamp an id it never checks).
 *
 * /api/templates
 *   - `POST /` and `POST /save` take `userId` FROM THE BODY and pass it straight
 *     to Prisma, so a caller can create a template that belongs to someone else.
 *   - `GET /user/:userId` returns that user's templates to anyone.
 *   - `PUT /:id` and `DELETE /:id` have no ownership check at all.
 *   - `POST /:id/share` / `/:id/unshare` let any caller re-share or unshare
 *     another user's template.
 *
 * /api/ux-review
 *   - `POST /` stamps `reviewerId` from the token (correct) but `PUT /:id` and
 *     `DELETE /:id` never check that the caller is that reviewer, and
 *     `POST /:id/assign` lets anyone assign anyone to any review.
 *
 * THE SECOND FINDING — CREDENTIAL EXPOSURE THROUGH A RELATION
 * ----------------------------------------------------------
 * `templateService` eagerly loads the `user` relation with a bare
 * `include: { user: true }` in TWELVE places. That returns the ENTIRE User row,
 * which a live probe confirmed includes `password` (bcrypt), `mfaSecret`,
 * `refreshToken`, `passwordHistory`, `passwordResetToken` and
 * `biometricPublicKey`. This is the same defect previously fixed in
 * `userController`'s listing, resurfacing through a nested include where a
 * route-level response-shape test would never look. The assertions below read
 * the raw JSON, so a future `include: true` cannot creep back in unnoticed.
 */

let server: http.Server;

describe('Template / UX-review authorization', () => {
  let admin: { id: string; token: string };
  let alice: { id: string; token: string };
  let bob: { id: string; token: string };

  let aliceTemplateId: string;
  let bobTemplateId: string;
  let aliceReviewId: string;

  const signToken = (id: string, role: UserRole): string =>
    jwt.sign({ id, role }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

  const mkUser = async (email: string, role: UserRole) => {
    const user = await prisma.user.create({
      data: {
        email,
        // A recognisable sentinel: if this string ever appears in an HTTP
        // response, a User row was serialised wholesale.
        password: 'SENTINEL-BCRYPT-HASH-DO-NOT-LEAK',
        firstName: role,
        lastName: 'Fixture',
        role,
        mfaEnabled: true,
        mfaSecret: 'SENTINEL-MFA-SECRET-DO-NOT-LEAK',
      },
    });
    return { id: user.id, token: signToken(user.id, role) };
  };

  beforeAll(async () => {
    server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    await resetDatabase(prisma);

    admin = await mkUser('tpl-admin@example.com', UserRole.ADMIN);
    alice = await mkUser('tpl-alice@example.com', UserRole.PROPERTY_MANAGER);
    bob = await mkUser('tpl-bob@example.com', UserRole.PROPERTY_MANAGER);

    const aliceTemplate = await prisma.userTemplate.create({
      data: {
        userId: alice.id,
        templateName: 'Alice Layout',
        layout: { columns: 2 },
        role: 'PROPERTY_MANAGER',
      },
    });
    aliceTemplateId = aliceTemplate.id;

    const bobTemplate = await prisma.userTemplate.create({
      data: {
        userId: bob.id,
        templateName: 'Bob Layout',
        layout: { columns: 3 },
        role: 'PROPERTY_MANAGER',
      },
    });
    bobTemplateId = bobTemplate.id;

    const review = await prisma.uXReview.create({
      data: {
        title: 'Alice private review',
        description: 'Confidential UX findings',
        componentType: 'DASHBOARD',
        reviewerId: alice.id,
      },
    });
    aliceReviewId = review.id;
  });

  afterAll(async () => {
    await resetDatabase(prisma);
    await prisma.$disconnect();
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // ---------------------------------------------------------- templates ---
  describe('/api/templates', () => {
    it('does not let a caller create a template owned by someone else', async () => {
      const res = await request(server)
        .post('/api/templates')
        .set('Authorization', `Bearer ${bob.token}`)
        .send({
          userId: alice.id, // <- the attack
          templateName: 'Impersonated Layout',
          layout: { columns: 1 },
          role: 'PROPERTY_MANAGER',
        });

      // Either refused, or accepted with the caller as owner. What must NOT
      // happen is a template filed under Alice's account.
      const created = await prisma.userTemplate.findFirst({
        where: { templateName: 'Impersonated Layout' },
      });
      if (created) {
        expect(created.userId).toBe(bob.id);
      } else {
        expect([400, 403]).toContain(res.status);
      }
    });

    it('does not let a caller list another user’s templates', async () => {
      const res = await request(server)
        .get(`/api/templates/user/${alice.id}`)
        .set('Authorization', `Bearer ${bob.token}`);

      expect(res.status).toBe(403);
      expect(JSON.stringify(res.body)).not.toContain('Alice Layout');
    });

    it('lets a user list their own templates', async () => {
      const res = await request(server)
        .get(`/api/templates/user/${bob.id}`)
        .set('Authorization', `Bearer ${bob.token}`);

      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body)).toContain('Bob Layout');
    });

    it('does not let a caller update another user’s template', async () => {
      const res = await request(server)
        .put(`/api/templates/${aliceTemplateId}`)
        .set('Authorization', `Bearer ${bob.token}`)
        .send({ templateName: 'Hijacked' });

      expect(res.status).toBe(403);

      const after = await prisma.userTemplate.findUnique({ where: { id: aliceTemplateId } });
      expect(after?.templateName).toBe('Alice Layout');
    });

    it('lets the owner update their own template', async () => {
      const res = await request(server)
        .put(`/api/templates/${aliceTemplateId}`)
        .set('Authorization', `Bearer ${alice.token}`)
        .send({ templateName: 'Alice Layout v2' });

      expect(res.status).toBe(200);

      const after = await prisma.userTemplate.findUnique({ where: { id: aliceTemplateId } });
      expect(after?.templateName).toBe('Alice Layout v2');
    });

    it('does not let a caller delete another user’s template', async () => {
      const res = await request(server)
        .delete(`/api/templates/${bobTemplateId}`)
        .set('Authorization', `Bearer ${alice.token}`);

      expect(res.status).toBe(403);

      const still = await prisma.userTemplate.findUnique({ where: { id: bobTemplateId } });
      expect(still).not.toBeNull();
    });

    it('does not let a caller re-point a template’s owner through update', async () => {
      const res = await request(server)
        .put(`/api/templates/${bobTemplateId}`)
        .set('Authorization', `Bearer ${bob.token}`)
        .send({ userId: alice.id, templateName: 'Moved' });

      const after = await prisma.userTemplate.findUnique({ where: { id: bobTemplateId } });
      // userId is a tenancy key: it must never be writable, whatever the status.
      expect(after?.userId).toBe(bob.id);
      expect([200, 400, 403]).toContain(res.status);
    });

    it('never serialises a User credential through a template response', async () => {
      const res = await request(server)
        .get(`/api/templates/${aliceTemplateId}`)
        .set('Authorization', `Bearer ${alice.token}`);

      expect(res.status).toBe(200);

      // Scan the RAW body, not a parsed field: a nested `include: { user: true }`
      // is exactly the blind spot a typed assertion would miss.
      const raw = JSON.stringify(res.body);
      expect(raw).not.toContain('SENTINEL-BCRYPT-HASH-DO-NOT-LEAK');
      expect(raw).not.toContain('SENTINEL-MFA-SECRET-DO-NOT-LEAK');
      expect(raw).not.toContain('passwordHistory');
      expect(raw).not.toContain('refreshToken');
      expect(raw).not.toContain('mfaSecret');
    });

    it('never serialises a User credential through the user-template listing', async () => {
      const res = await request(server)
        .get(`/api/templates/user/${bob.id}`)
        .set('Authorization', `Bearer ${bob.token}`);

      expect(res.status).toBe(200);

      const raw = JSON.stringify(res.body);
      expect(raw).not.toContain('SENTINEL-BCRYPT-HASH-DO-NOT-LEAK');
      expect(raw).not.toContain('SENTINEL-MFA-SECRET-DO-NOT-LEAK');
    });

    it('lets ADMIN read another user’s templates', async () => {
      const res = await request(server)
        .get(`/api/templates/user/${alice.id}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
    });
  });

  // --------------------------------------------------------- ux reviews ---
  describe('/api/ux-review', () => {
    it('does not let a caller update another reviewer’s review', async () => {
      const res = await request(server)
        .put(`/api/ux-review/${aliceReviewId}`)
        .set('Authorization', `Bearer ${bob.token}`)
        .send({ title: 'Hijacked review' });

      expect(res.status).toBe(403);

      const after = await prisma.uXReview.findUnique({ where: { id: aliceReviewId } });
      expect(after?.title).toBe('Alice private review');
    });

    it('does not let a caller delete another reviewer’s review', async () => {
      const res = await request(server)
        .delete(`/api/ux-review/${aliceReviewId}`)
        .set('Authorization', `Bearer ${bob.token}`);

      expect(res.status).toBe(403);

      const still = await prisma.uXReview.findUnique({ where: { id: aliceReviewId } });
      expect(still).not.toBeNull();
    });

    it('does not let a caller re-assign another reviewer’s review', async () => {
      const res = await request(server)
        .post(`/api/ux-review/${aliceReviewId}/assign`)
        .set('Authorization', `Bearer ${bob.token}`)
        .send({ assignedToId: bob.id });

      expect(res.status).toBe(403);
    });

    it('stamps the reviewer from the token, not the body', async () => {
      const res = await request(server)
        .post('/api/ux-review')
        .set('Authorization', `Bearer ${bob.token}`)
        .send({
          title: 'Bob review',
          componentType: 'SETTINGS',
          reviewerId: alice.id, // <- must be ignored
        });

      expect(res.status).toBe(201);

      const created = await prisma.uXReview.findFirst({ where: { title: 'Bob review' } });
      expect(created?.reviewerId).toBe(bob.id);
    });

    it('lets the owning reviewer update their own review', async () => {
      const res = await request(server)
        .put(`/api/ux-review/${aliceReviewId}`)
        .set('Authorization', `Bearer ${alice.token}`)
        .send({ title: 'Alice private review v2' });

      expect(res.status).toBe(200);

      const after = await prisma.uXReview.findUnique({ where: { id: aliceReviewId } });
      expect(after?.title).toBe('Alice private review v2');
    });
  });
});
