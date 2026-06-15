import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { seedDefaultCategories, seedDefaultIncomeSources, initializeNewUser } from '../../services/category.service';
import Category from '../../models/Category.model';
import IncomeSource from '../../models/IncomeSource.model';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: 'service_test' });
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
}, 30000);

beforeEach(async () => {
  await Category.deleteMany({});
  await IncomeSource.deleteMany({});
});

describe('category.service', () => {
  const fakeUserId = new mongoose.Types.ObjectId();

  describe('seedDefaultCategories', () => {
    it('should seed 7 default categories for a new user', async () => {
      await seedDefaultCategories(fakeUserId);

      const cats = await Category.find({ userId: fakeUserId });
      expect(cats.length).toBe(7);

      const labels = cats.map(c => c.label).sort();
      expect(labels).toContain('Food & Drink');
      expect(labels).toContain('Transport');
      expect(labels).toContain('Other');
    });

    it('should NOT re-seed if categories already exist', async () => {
      await seedDefaultCategories(fakeUserId);
      await seedDefaultCategories(fakeUserId); // Second call

      const cats = await Category.find({ userId: fakeUserId });
      expect(cats.length).toBe(7); // Should still be 7, not 14
    });

    it('should set correct order values', async () => {
      await seedDefaultCategories(fakeUserId);

      const cats = await Category.find({ userId: fakeUserId }).sort({ order: 1 });
      expect(cats[0].order).toBe(0);
      expect(cats[6].order).toBe(6);
    });
  });

  describe('seedDefaultIncomeSources', () => {
    it('should seed 6 default income sources', async () => {
      await seedDefaultIncomeSources(fakeUserId);

      const sources = await IncomeSource.find({ userId: fakeUserId });
      expect(sources.length).toBe(6);
      expect(sources.every(s => s.isDefault)).toBe(true);
    });

    it('should NOT re-seed if sources already exist', async () => {
      await seedDefaultIncomeSources(fakeUserId);
      await seedDefaultIncomeSources(fakeUserId);

      const sources = await IncomeSource.find({ userId: fakeUserId });
      expect(sources.length).toBe(6);
    });
  });

  describe('initializeNewUser', () => {
    it('should seed both categories and income sources', async () => {
      const userId = new mongoose.Types.ObjectId();
      await initializeNewUser(userId);

      const cats = await Category.find({ userId });
      const sources = await IncomeSource.find({ userId });

      expect(cats.length).toBe(7);
      expect(sources.length).toBe(6);
    });
  });
});
