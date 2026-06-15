import request from 'supertest';
import app from '../../app';
import User from '../../models/User.model';
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

describe('User Controller — Frequency Map', () => {

  describe('GET /api/users/me/frequency-map', () => {
    it('should return empty object by default', async () => {
      const res = await request(app)
        .get('/api/users/me/frequency-map')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({});
    });
  });

  describe('PUT /api/users/me/frequency-map', () => {
    it('should store and retrieve frequency map', async () => {
      const map = {
        'lunch': { 'cat_food': 5, 'cat_drink': 2 },
        'uber': { 'cat_transport': 10 },
      };

      const putRes = await request(app)
        .put('/api/users/me/frequency-map')
        .set('Authorization', `Bearer ${token}`)
        .send({ frequencyMap: map });

      expect(putRes.status).toBe(200);

      const getRes = await request(app)
        .get('/api/users/me/frequency-map')
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.body.data).toMatchObject(map);
    });

    it('should reject frequency map exceeding 500 keys', async () => {
      const bigMap: Record<string, Record<string, number>> = {};
      for (let i = 0; i < 501; i++) {
        bigMap[`key_${i}`] = { cat: 1 };
      }

      const res = await request(app)
        .put('/api/users/me/frequency-map')
        .set('Authorization', `Bearer ${token}`)
        .send({ frequencyMap: bigMap });

      expect(res.status).toBe(400);
    });
  });
});
