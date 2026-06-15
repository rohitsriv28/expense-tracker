import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';

let mongoServer: MongoMemoryServer;

// Must be set before any route handler reads it
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_key';
process.env.NODE_ENV = 'test';

export async function setupTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { dbName: 'cashflow_test' });
}

export async function teardownTestDB() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}

export async function clearAllCollections() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Creates a test user and returns { user, token }
 */
export async function createTestUser(overrides: Partial<any> = {}) {
  const user = await User.create({
    googleId: overrides.googleId || `google_${Date.now()}_${Math.random()}`,
    email: overrides.email || `test_${Date.now()}@example.com`,
    displayName: overrides.displayName || 'Test User',
    photoURL: overrides.photoURL || '',
    ...overrides,
  });

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' } as jwt.SignOptions,
  );

  return { user, token };
}
