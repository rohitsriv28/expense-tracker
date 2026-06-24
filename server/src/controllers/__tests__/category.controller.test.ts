import request from 'supertest';
import app from '../../app';
import Category from '../../models/Category.model';
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
  await Category.deleteMany({});
});

describe('Category Controller', () => {

  describe('GET /api/categories', () => {
    it('should return empty array when no categories', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('should return categories sorted by order', async () => {
      await Category.create([
        { userId, label: 'Bills', color: '#green', icon: 'Home', type: 'default', order: 2 },
        { userId, label: 'Food', color: '#orange', icon: 'Coffee', type: 'default', order: 0 },
      ]);

      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].name).toBe('Food');
      expect(res.body.data[1].name).toBe('Bills');
    });

    it('should map internal label field to external name field', async () => {
      await Category.create({
        userId, label: 'TestCat', color: '#fff', icon: 'Star', type: 'custom',
      });

      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.data[0].name).toBe('TestCat');
      expect(res.body.data[0].label).toBeUndefined(); // Should not leak internal field
    });
  });

  describe('POST /api/categories', () => {
    it('should create a category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Groceries', icon: 'ShoppingCart', color: '#22c55e' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Groceries');
      expect(res.body.data.icon).toBe('ShoppingCart');
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'NoColor' }); // missing icon and color

      expect(res.status).toBe(400);
    });

    it('should reject duplicate category label for same user', async () => {
      await Category.create({
        userId, label: 'Duplicate', color: '#fff', icon: 'Star', type: 'custom',
      });

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Duplicate', icon: 'Star', color: '#fff' });

      expect(res.status).toBe(409);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update a category', async () => {
      const cat = await Category.create({
        userId, label: 'OldName', color: '#fff', icon: 'Star', type: 'custom',
      });

      const res = await request(app)
        .put(`/api/categories/${cat._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'NewName', color: '#000' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('NewName');
      expect(res.body.data.color).toBe('#000');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete a custom category', async () => {
      const cat = await Category.create({
        userId, label: 'ToDelete', color: '#fff', icon: 'Star', type: 'custom',
      });

      const res = await request(app)
        .delete(`/api/categories/${cat._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should NOT delete a default category', async () => {
      const cat = await Category.create({
        userId, label: 'DefaultCat', color: '#fff', icon: 'Star', type: 'default',
      });

      const res = await request(app)
        .delete(`/api/categories/${cat._id}`)
        .set('Authorization', `Bearer ${token}`);

      // Default categories cannot be deleted and return 403 Forbidden
      expect(res.status).toBe(403);
    });
  });
});
