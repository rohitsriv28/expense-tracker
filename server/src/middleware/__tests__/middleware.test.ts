import request from 'supertest';
import app from '../../app';
import { setupTestDB, teardownTestDB, createTestUser } from '../../__tests__/setup';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

beforeAll(async () => {
  await setupTestDB();
}, 60000);

afterAll(async () => {
  await teardownTestDB();
}, 30000);

describe('Middleware', () => {

  // ─── authenticate ─────────────────────────────────────────────────────────────

  describe('authenticate', () => {
    it('should reject request without Authorization header', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/authentication required/i);
    });

    it('should reject malformed Authorization header (no Bearer prefix)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'NotBearer sometoken');
      expect(res.status).toBe(401);
    });

    it('should reject expired token', async () => {
      const expired = jwt.sign(
        { userId: new mongoose.Types.ObjectId() },
        process.env.JWT_SECRET!,
        { expiresIn: '0s' } as jwt.SignOptions,
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expired}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/expired/i);
    });

    it('should reject token for non-existent user', async () => {
      const orphan = jwt.sign(
        { userId: new mongoose.Types.ObjectId() },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' } as jwt.SignOptions,
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${orphan}`);

      expect(res.status).toBe(401);
    });

    it('should accept valid token', async () => {
      const { token } = await createTestUser({ googleId: 'auth_valid', email: 'auth_valid@ex.com' });
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  // ─── errorHandler ─────────────────────────────────────────────────────────────

  describe('errorHandler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent-route');
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should handle invalid ObjectId (CastError)', async () => {
      const { token } = await createTestUser({ googleId: 'err_cast', email: 'err_cast@ex.com' });
      const res = await request(app)
        .put('/api/expenses/not-an-objectid')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 100 });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid id/i);
    });
  });

  // ─── Health endpoint ──────────────────────────────────────────────────────────

  describe('Health endpoint', () => {
    it('should return ok status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });
});
