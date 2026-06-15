import request from 'supertest';
import app from '../../app';
import IncomeSource from '../../models/IncomeSource.model';
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
  await IncomeSource.deleteMany({});
});

describe('Income Source Controller', () => {

  describe('GET /api/income-sources', () => {
    it('should return empty array when no sources', async () => {
      const res = await request(app)
        .get('/api/income-sources')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('POST /api/income-sources', () => {
    it('should create an income source', async () => {
      const res = await request(app)
        .post('/api/income-sources')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Consulting', icon: 'Code', color: '#8b5cf6', frequency: 'irregular' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Consulting');
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/income-sources')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Incomplete' }); // missing icon, color

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/income-sources/:id', () => {
    it('should update an income source', async () => {
      const source = await IncomeSource.create({
        userId, name: 'Old', icon: 'Star', color: '#fff', frequency: 'monthly',
      });

      const res = await request(app)
        .put(`/api/income-sources/${source._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated');
    });
  });

  describe('DELETE /api/income-sources/:id', () => {
    it('should delete a non-default source', async () => {
      const source = await IncomeSource.create({
        userId, name: 'Custom', icon: 'Star', color: '#fff', frequency: 'monthly', isDefault: false,
      });

      const res = await request(app)
        .delete(`/api/income-sources/${source._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should NOT delete a default source', async () => {
      const source = await IncomeSource.create({
        userId, name: 'Salary', icon: 'Briefcase', color: '#3b82f6', frequency: 'monthly', isDefault: true,
      });

      const res = await request(app)
        .delete(`/api/income-sources/${source._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
