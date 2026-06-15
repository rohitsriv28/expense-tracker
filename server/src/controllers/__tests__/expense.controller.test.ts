import request from 'supertest';
import app from '../../app';
import Expense from '../../models/Expense.model';
import { setupTestDB, teardownTestDB, clearAllCollections, createTestUser } from '../../__tests__/setup';

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
  await Expense.deleteMany({});
});

const validExpense = {
  amount: 150,
  remarks: 'Lunch at office',
  date: new Date().toISOString(),
  category: 'Food & Drink',
};

describe('Expense Controller', () => {

  // ─── Authentication ───────────────────────────────────────────────────────────

  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      const res = await request(app).get('/api/expenses');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject requests with invalid token', async () => {
      const res = await request(app)
        .get('/api/expenses')
        .set('Authorization', 'Bearer invalid_token_here');
      expect(res.status).toBe(401);
    });
  });

  // ─── GET /api/expenses ────────────────────────────────────────────────────────

  describe('GET /api/expenses', () => {
    it('should return empty array with pagination when no expenses exist', async () => {
      const res = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.expenses).toEqual([]);
      expect(res.body.data.pagination).toMatchObject({
        page: 1,
        total: 0,
        hasMore: false,
      });
    });

    it('should paginate results correctly', async () => {
      // Create 15 expenses
      const expenses = Array.from({ length: 15 }, (_, i) => ({
        userId,
        amount: (i + 1) * 10,
        remarks: `Expense ${i + 1}`,
        date: new Date(2026, 5, i + 1),
        editCount: 0,
      }));
      await Expense.insertMany(expenses);

      const page1 = await request(app)
        .get('/api/expenses?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(page1.status).toBe(200);
      expect(page1.body.data.expenses.length).toBe(10);
      expect(page1.body.data.pagination.hasMore).toBe(true);
      expect(page1.body.data.pagination.total).toBe(15);
      expect(page1.body.data.pagination.pages).toBe(2);

      const page2 = await request(app)
        .get('/api/expenses?page=2&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(page2.body.data.expenses.length).toBe(5);
      expect(page2.body.data.pagination.hasMore).toBe(false);
    });

    it('should filter by category', async () => {
      await Expense.create([
        { userId, amount: 50, remarks: 'Food', date: new Date(), category: 'Food', editCount: 0 },
        { userId, amount: 30, remarks: 'Bus', date: new Date(), category: 'Transport', editCount: 0 },
      ]);

      const res = await request(app)
        .get('/api/expenses?category=Food')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.data.expenses.length).toBe(1);
      expect(res.body.data.expenses[0].category).toBe('Food');
    });

    it('should filter by date range', async () => {
      await Expense.create([
        { userId, amount: 10, remarks: 'Old', date: new Date('2025-01-01'), editCount: 0 },
        { userId, amount: 20, remarks: 'New', date: new Date('2026-06-01'), editCount: 0 },
      ]);

      const res = await request(app)
        .get('/api/expenses?startDate=2026-01-01T00:00:00.000Z&endDate=2026-12-31T23:59:59.999Z')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.data.expenses.length).toBe(1);
      expect(res.body.data.expenses[0].remarks).toBe('New');
    });

    it('should sort by amount ascending', async () => {
      await Expense.create([
        { userId, amount: 200, remarks: 'Big', date: new Date(), editCount: 0 },
        { userId, amount: 10, remarks: 'Small', date: new Date(), editCount: 0 },
      ]);

      const res = await request(app)
        .get('/api/expenses?sortBy=amount&sortDir=asc')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.data.expenses[0].amount).toBe(10);
      expect(res.body.data.expenses[1].amount).toBe(200);
    });
  });

  // ─── GET /api/expenses/all ────────────────────────────────────────────────────

  describe('GET /api/expenses/all', () => {
    it('should return all expenses without pagination', async () => {
      await Expense.insertMany(
        Array.from({ length: 25 }, (_, i) => ({
          userId,
          amount: i + 1,
          remarks: `Exp ${i}`,
          date: new Date(),
          editCount: 0,
        }))
      );

      const res = await request(app)
        .get('/api/expenses/all')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(25);
    });
  });

  // ─── POST /api/expenses ───────────────────────────────────────────────────────

  describe('POST /api/expenses', () => {
    it('should create an expense successfully', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send(validExpense);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(150);
      expect(res.body.data.remarks).toBe('Lunch at office');
      expect(res.body.data.editCount).toBe(0);
      expect(res.body.data._id).toBeDefined();
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 100 }); // missing remarks and date

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject negative amount', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validExpense, amount: -10 });

      expect(res.status).toBe(400);
    });

    it('should reject amount exceeding max', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validExpense, amount: 10_000_001 });

      expect(res.status).toBe(400);
    });

    it('should reject empty remarks', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validExpense, remarks: '' });

      expect(res.status).toBe(400);
    });
  });

  // ─── PUT /api/expenses/:id ────────────────────────────────────────────────────

  describe('PUT /api/expenses/:id', () => {
    it('should update an expense successfully', async () => {
      const expense = await Expense.create({ ...validExpense, userId, editCount: 0 });

      const res = await request(app)
        .put(`/api/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 200 });

      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(200);
      expect(res.body.data.editCount).toBe(1);
    });

    it('should enforce edit limit of 3', async () => {
      const expense = await Expense.create({ ...validExpense, userId, editCount: 3 });

      const res = await request(app)
        .put(`/api/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 999 });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/edit limit/i);
    });

    it('should return 404 for non-existent expense', async () => {
      const fakeId = new (require('mongoose').Types.ObjectId)();
      const res = await request(app)
        .put(`/api/expenses/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 100 });

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid ObjectId format', async () => {
      const res = await request(app)
        .put('/api/expenses/not-a-valid-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 100 });

      expect(res.status).toBe(400);
    });
  });

  // ─── DELETE /api/expenses/:id ─────────────────────────────────────────────────

  describe('DELETE /api/expenses/:id', () => {
    it('should delete an expense successfully', async () => {
      const expense = await Expense.create({ ...validExpense, userId, editCount: 0 });

      const res = await request(app)
        .delete(`/api/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deleted = await Expense.findById(expense._id);
      expect(deleted).toBeNull();
    });

    it('should return 404 when deleting non-existent expense', async () => {
      const fakeId = new (require('mongoose').Types.ObjectId)();
      const res = await request(app)
        .delete(`/api/expenses/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── Ownership isolation ──────────────────────────────────────────────────────

  describe('Ownership isolation', () => {
    it('should not allow a user to update another user\'s expense', async () => {
      const other = await createTestUser({ googleId: 'other_google', email: 'other@example.com' });
      const expense = await Expense.create({
        ...validExpense,
        userId: other.user._id,
        editCount: 0,
      });

      const res = await request(app)
        .put(`/api/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 999 });

      expect(res.status).toBe(403);
    });

    it('should not allow a user to delete another user\'s expense', async () => {
      const other = await createTestUser({ googleId: 'other2_google', email: 'other2@example.com' });
      const expense = await Expense.create({
        ...validExpense,
        userId: other.user._id,
        editCount: 0,
      });

      const res = await request(app)
        .delete(`/api/expenses/${expense._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should not return other user\'s expenses in GET listing', async () => {
      const other = await createTestUser({ googleId: 'other3_google', email: 'other3@example.com' });
      await Expense.create({
        ...validExpense,
        userId: other.user._id,
        editCount: 0,
      });

      const res = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.data.expenses.length).toBe(0);
    });
  });
});
