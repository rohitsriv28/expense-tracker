import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveToCache,
  getFromCache,
  addToQueue,
  getQueue,
  removeFromQueue,
  cacheStore,
  queueStore,
  failedStore,
  invalidateCacheByPrefix,
  injectOptimisticItemIntoCache,
  updateItemInCache,
  deleteItemFromCache,
  evictStaleCacheEntries,
  markCacheEntryStale,
  resetStuckQueueItems,
  processSyncQueue,
  retryFailedItems,
  clearFailedItems,
  getFailedQueueItems,
} from '../offlineSync';

// Mock smartDefaults to prevent apiClient import side-effects
vi.mock('../../utils/smartDefaults', () => ({
  pushFrequencyMapToServer: vi.fn(),
}));

describe('offlineSync', () => {
  beforeEach(async () => {
    await cacheStore.clear();
    await queueStore.clear();
    await failedStore.clear();
    vi.clearAllMocks();
  });

  // ─── Cache Operations ─────────────────────────────────────────────────────────

  describe('Cache: saveToCache / getFromCache', () => {
    it('should save and retrieve data with correct envelope', async () => {
      await saveToCache('/api/test', { id: 1 });
      const result = await getFromCache('/api/test');

      expect(result).not.toBeNull();
      expect(result?.data).toEqual({ id: 1 });
      expect(result?.isStale).toBe(false);
    });

    it('should return null for missing keys', async () => {
      const result = await getFromCache('/api/missing');
      expect(result).toBeNull();
    });

    it('should update lastAccessed on read', async () => {
      await saveToCache('/api/test', 'data');
      const entry1 = await cacheStore.getItem('/api/test') as any;
      const accessed1 = entry1.lastAccessed;

      // Small delay to ensure timestamp difference
      await new Promise(r => setTimeout(r, 10));
      await getFromCache('/api/test');
      const entry2 = await cacheStore.getItem('/api/test') as any;

      expect(entry2.lastAccessed).toBeGreaterThanOrEqual(accessed1);
    });

    it('should wrap legacy (non-envelope) cache entries', async () => {
      // Simulate a legacy entry without envelope
      await cacheStore.setItem('/api/legacy', [{ id: 1 }]);
      const result = await getFromCache('/api/legacy');

      expect(result?.data).toEqual([{ id: 1 }]);
      expect(result?.isStale).toBe(false);
    });
  });

  // ─── markCacheEntryStale ──────────────────────────────────────────────────────

  describe('markCacheEntryStale', () => {
    it('should mark an existing cache entry as stale', async () => {
      await saveToCache('/api/expenses', []);
      await markCacheEntryStale('/api/expenses');

      const result = await getFromCache('/api/expenses');
      expect(result?.isStale).toBe(true);
    });
  });

  // ─── invalidateCacheByPrefix ──────────────────────────────────────────────────

  describe('invalidateCacheByPrefix', () => {
    it('should delete matching cache entries in delete mode', async () => {
      await saveToCache('/api/expenses?page=1', []);
      await saveToCache('/api/expenses?page=2', []);
      await saveToCache('/api/income', []);

      await invalidateCacheByPrefix('/api/expenses', 'delete');

      expect(await getFromCache('/api/expenses?page=1')).toBeNull();
      expect(await getFromCache('/api/expenses?page=2')).toBeNull();
      expect(await getFromCache('/api/income')).not.toBeNull();
    });

    it('should mark matching entries as stale in stale mode', async () => {
      await saveToCache('/api/expenses?page=1', []);
      await saveToCache('/api/income', []);

      await invalidateCacheByPrefix('/api/expenses', 'stale');

      const expResult = await getFromCache('/api/expenses?page=1');
      const incResult = await getFromCache('/api/income');

      expect(expResult?.isStale).toBe(true);
      expect(incResult?.isStale).toBe(false);
    });
  });

  // ─── Optimistic Cache Operations ──────────────────────────────────────────────

  describe('injectOptimisticItemIntoCache', () => {
    it('should prepend item to array cache', async () => {
      await saveToCache('/api/expenses', [{ _id: 'existing' }]);

      await injectOptimisticItemIntoCache('/api/expenses', { _id: 'temp-1', amount: 100 });

      const result = await getFromCache('/api/expenses');
      expect(result?.data.length).toBe(2);
      expect(result?.data[0]._id).toBe('temp-1');
      expect(result?.isStale).toBe(true);
    });
  });

  describe('updateItemInCache', () => {
    it('should update a specific item in cache by _id', async () => {
      await saveToCache('/api/expenses', [
        { _id: 'e1', amount: 100 },
        { _id: 'e2', amount: 200 },
      ]);

      await updateItemInCache('/api/expenses', 'e1', { amount: 999 });

      const result = await getFromCache('/api/expenses');
      expect(result?.data[0].amount).toBe(999);
      expect(result?.data[1].amount).toBe(200);
    });
  });

  describe('deleteItemFromCache', () => {
    it('should remove item from cache by _id', async () => {
      await saveToCache('/api/expenses', [
        { _id: 'e1', amount: 100 },
        { _id: 'e2', amount: 200 },
      ]);

      await deleteItemFromCache('/api/expenses', 'e1');

      const result = await getFromCache('/api/expenses');
      expect(result?.data.length).toBe(1);
      expect(result?.data[0]._id).toBe('e2');
    });
  });

  // ─── Cache Eviction ───────────────────────────────────────────────────────────

  describe('evictStaleCacheEntries', () => {
    it('should evict entries older than 30 days', async () => {
      // Save an old entry
      const oldEnvelope = {
        data: 'old_data',
        cachedAt: Date.now() - 31 * 24 * 60 * 60 * 1000,
        lastAccessed: Date.now() - 31 * 24 * 60 * 60 * 1000,
        stale: false,
      };
      await cacheStore.setItem('/api/old', oldEnvelope);
      await saveToCache('/api/fresh', 'fresh_data');

      await evictStaleCacheEntries();

      expect(await cacheStore.getItem('/api/old')).toBeNull();
      expect(await cacheStore.getItem('/api/fresh')).not.toBeNull();
    });
  });

  // ─── Queue Operations ─────────────────────────────────────────────────────────

  describe('Queue: addToQueue / getQueue / removeFromQueue', () => {
    const request = {
      id: 'temp-123',
      method: 'post',
      url: '/api/expenses',
      data: { amount: 100 },
      headers: {},
      timestamp: Date.now(),
    };

    it('should add item to queue with pending status', async () => {
      await addToQueue(request as any);

      const queue = await getQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].status).toBe('pending');
      expect(queue[0].retryCount).toBe(0);
    });

    it('should return queue sorted by timestamp', async () => {
      await addToQueue({ ...request, id: 'temp-1', timestamp: 200 } as any);
      await addToQueue({ ...request, id: 'temp-2', timestamp: 100 } as any);

      const queue = await getQueue();
      expect(queue[0].id).toBe('temp-2'); // Earlier timestamp first
    });

    it('should remove item from queue', async () => {
      await addToQueue(request as any);
      await removeFromQueue('temp-123');

      const queue = await getQueue();
      expect(queue.length).toBe(0);
    });
  });

  describe('resetStuckQueueItems', () => {
    it('should reset processing items back to pending', async () => {
      await queueStore.setItem('stuck', {
        id: 'stuck', method: 'post', url: '/api/test', data: {},
        headers: {}, timestamp: Date.now(), status: 'processing', retryCount: 0,
      });

      await resetStuckQueueItems();

      const item = await queueStore.getItem('stuck') as any;
      expect(item.status).toBe('pending');
    });
  });

  // ─── processSyncQueue ─────────────────────────────────────────────────────────

  describe('processSyncQueue', () => {
    it('should process pending items and remove on success', async () => {
      await queueStore.setItem('temp-1', {
        id: 'temp-1', method: 'post', url: '/api/expenses',
        data: { amount: 100 }, headers: {}, timestamp: Date.now(),
        status: 'pending', retryCount: 0,
      });

      const mockApi = {
        request: vi.fn().mockResolvedValue({ data: { data: { _id: 'real-1' } } }),
      };

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      const summary = await processSyncQueue(mockApi as any);

      expect(summary?.synced).toBe(1);
      expect(summary?.failed).toBe(0);
      expect(mockApi.request).toHaveBeenCalledTimes(1);
      expect(dispatchSpy).toHaveBeenCalled();

      const remaining = await getQueue();
      expect(remaining.length).toBe(0);
    });

    it('should skip items that have already hit 3 retries', async () => {
      await queueStore.setItem('maxed', {
        id: 'maxed', method: 'post', url: '/api/expenses',
        data: {}, headers: {}, timestamp: Date.now(),
        status: 'failed', retryCount: 3,
      });

      const mockApi = { request: vi.fn() };
      await processSyncQueue(mockApi as any);

      expect(mockApi.request).not.toHaveBeenCalled();
    });

    it('should resolve temp IDs in sequential POST+PUT', async () => {
      await queueStore.setItem('temp-1', {
        id: 'temp-1', method: 'post', url: '/api/expenses',
        data: { amount: 50 }, headers: {}, timestamp: 100,
        status: 'pending', retryCount: 0,
      });
      await queueStore.setItem('temp-2', {
        id: 'temp-2', method: 'put', url: '/api/expenses/temp-1',
        data: { amount: 75 }, headers: {}, timestamp: 200,
        status: 'pending', retryCount: 0,
      });

      const mockApi = {
        request: vi.fn()
          .mockResolvedValueOnce({ data: { data: { _id: 'real-mongo-id' } } }) // POST
          .mockResolvedValueOnce({ data: { data: {} } }), // PUT
      };

      await processSyncQueue(mockApi as any);

      // Second call should have resolved temp-1 → real-mongo-id
      expect(mockApi.request).toHaveBeenNthCalledWith(2, expect.objectContaining({
        url: '/api/expenses/real-mongo-id',
      }));
    });

    it('should return early when offline', async () => {
      // Override navigator.onLine
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      const mockApi = { request: vi.fn() };

      const result = await processSyncQueue(mockApi as any);
      expect(result).toEqual({ synced: 0, failed: 0, failedItems: [] });
      expect(mockApi.request).not.toHaveBeenCalled();

      // Restore
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    });
  });

  // ─── Failed Items ─────────────────────────────────────────────────────────────

  describe('Failed queue operations', () => {
    it('should retry failed items by resetting retryCount and status', async () => {
      await failedStore.setItem('f1', {
        id: 'f1', method: 'post', url: '/api/test', data: {},
        headers: {}, timestamp: Date.now(), status: 'failed', retryCount: 3,
      });

      await retryFailedItems();

      const failedItems = await getFailedQueueItems();
      expect(failedItems.length).toBe(0);

      const queue = await getQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].status).toBe('pending');
      expect(queue[0].retryCount).toBe(0);
    });

    it('should clear all failed items', async () => {
      await failedStore.setItem('f1', { id: 'f1' });
      await failedStore.setItem('f2', { id: 'f2' });

      await clearFailedItems();

      const items = await getFailedQueueItems();
      expect(items.length).toBe(0);
    });
  });
});
