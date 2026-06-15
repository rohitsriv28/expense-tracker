import request from 'supertest';
import app from '../../app';
import Budget from '../../models/Budget.model';
import { setupTestDB, teardownTestDB, createTestUser } from '../../__tests__/setup';

let token: string;
let userId: string;

beforeAll(async () => {
  await setupTestDB();
  const testData = await createTestUser();
  token = testData.token;
  userId = testData.user._id.toString();
}, 60000);

afterAll(async () => {
  await teardownTestDB();
}, 30000);

beforeEach(async () => {
  await Budget.deleteMany({});
});

const validBudget = {
  type: 'monthly_envelope' as const,
  name: 'June 2026 Budget',
  amount: 30000,
  month: 5, // June (0-indexed)
  year: 2026,
  allocations: {},
};

describe('Budget Controller', () => {

  describe('GET /api/budgets', () => {
    it('should return empty array when no budgets', async () => {
      const res = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('POST /api/budgets', () => {
    it('should create a budget successfully', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send(validBudget);

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('June 2026 Budget');
      expect(res.body.data.amount).toBe(30000);
      expect(res.body.data.month).toBe(5);
      expect(res.body.data.year).toBe(2026);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Incomplete' }); // missing amount, month, year

      expect(res.status).toBe(400);
    });

    it('should enforce unique budget per user/month/year', async () => {
      await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send(validBudget);

      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send(validBudget);

      // Should get 409 duplicate key error
      expect(res.status).toBe(409);
    });

    it('should create budget with allocations', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validBudget, allocations: { 'cat_id_1': 5000, 'cat_id_2': 10000 } });

      expect(res.status).toBe(201);
    });
  });

  describe('PUT /api/budgets/:id', () => {
    it('should update a budget', async () => {
      const budget = await Budget.create({ ...validBudget, userId });

      const res = await request(app)
        .put(`/api/budgets/${budget._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 40000 });

      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(40000);
    });

    it('should return 404 for non-existent budget', async () => {
      const fakeId = new (require('mongoose').Types.ObjectId)();
      const res = await request(app)
        .put(`/api/budgets/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 100 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/budgets/:id', () => {
    it('should delete a budget', async () => {
      const budget = await Budget.create({ ...validBudget, userId });

      const res = await request(app)
        .delete(`/api/budgets/${budget._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });
});
