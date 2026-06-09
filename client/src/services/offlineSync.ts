import localforage from "localforage";
import type { AxiosInstance } from "axios";
import { pushFrequencyMapToServer } from "../utils/smartDefaults";

// Separate instances for caching GETs and queuing mutations
export const cacheStore = localforage.createInstance({
  name: "CashFlow",
  storeName: "api_cache",
});

export const queueStore = localforage.createInstance({
  name: "CashFlow",
  storeName: "api_queue",
});

export interface QueuedRequest {
  id: string; // The temporary ID assigned locally
  method: string;
  url: string;
  data: any;
  headers: any;
  timestamp: number;
}

export const saveToCache = async (url: string, data: any) => {
  try {
    const envelope = {
      data,
      cachedAt: Date.now(),
      lastAccessed: Date.now()
    };
    await cacheStore.setItem(url, envelope);
  } catch (err) {
    console.error("Failed to save to cache", err);
  }
};

export const getFromCache = async (url: string) => {
  try {
    const entry: any = await cacheStore.getItem(url);
    if (!entry) return null;

    if (typeof entry === 'object' && 'data' in entry) {
      entry.lastAccessed = Date.now();
      await cacheStore.setItem(url, entry);
      return entry.data;
    } else {
      await saveToCache(url, entry);
      return entry;
    }
  } catch (err) {
    console.error("Failed to get from cache", err);
    return null;
  }
};

export async function evictStaleCacheEntries(): Promise<void> {
  try {
    const keys = await cacheStore.keys();
    const entries: { key: string; entry: any }[] = [];
    
    for (const key of keys) {
      const entry = await cacheStore.getItem(key);
      if (entry && typeof entry === 'object' && 'cachedAt' in entry) {
        entries.push({ key, entry });
      }
    }

    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    
    // Rule A: Age limit
    const survivors: { key: string; entry: any }[] = [];
    let evictedCount = 0;
    
    for (const item of entries) {
      if (now - item.entry.cachedAt > thirtyDaysMs) {
        await cacheStore.removeItem(item.key);
        evictedCount++;
      } else {
        survivors.push(item);
      }
    }

    // Rule B: LRU limit (100)
    if (survivors.length > 100) {
      survivors.sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);
      const toEvict = survivors.length - 100;
      for (let i = 0; i < toEvict; i++) {
        await cacheStore.removeItem(survivors[i].key);
        evictedCount++;
      }
    }

    if (evictedCount > 0) {
      console.debug(`Evicted ${evictedCount} stale cache entries.`);
    }
  } catch (err) {
    console.error("Failed to evict stale cache entries", err);
  }
}

export const addToQueue = async (request: QueuedRequest) => {
  try {
    await queueStore.setItem(request.id, request);
    // Dispatch custom event to notify UI
    window.dispatchEvent(new CustomEvent("offline-queue-updated"));
  } catch (err) {
    console.error("Failed to add to queue", err);
  }
};

export const getQueue = async (): Promise<QueuedRequest[]> => {
  try {
    const queue: QueuedRequest[] = [];
    await queueStore.iterate((value: QueuedRequest) => {
      queue.push(value);
    });
    return queue.sort((a, b) => a.timestamp - b.timestamp);
  } catch (err) {
    console.error("Failed to get queue", err);
    return [];
  }
};

export const removeFromQueue = async (id: string) => {
  try {
    await queueStore.removeItem(id);
    window.dispatchEvent(new CustomEvent("offline-queue-updated"));
  } catch (err) {
    console.error("Failed to remove from queue", err);
  }
};

export const processSyncQueue = async (apiClient: AxiosInstance) => {
  if (!navigator.onLine) return;

  const queue = await getQueue();
  if (queue.length === 0) return;

  console.log(`Processing ${queue.length} offline queued requests...`);
  
  const tempIdMap = new Map<string, string>();

  for (const req of queue) {
    try {
      let resolvedUrl = req.url;
      for (const [tempId, realId] of tempIdMap.entries()) {
        if (resolvedUrl.includes(tempId)) {
          resolvedUrl = resolvedUrl.replace(tempId, realId);
        }
      }

      let resolvedData = req.data;
      if (resolvedData && typeof resolvedData === 'object') {
        for (const [tempId, realId] of tempIdMap.entries()) {
          if (resolvedData._id === tempId) {
            resolvedData._id = realId;
          }
        }
      }

      // Replay the request
      const response = await apiClient.request({
        method: req.method,
        url: resolvedUrl,
        data: resolvedData,
      });

      // If successful POST, map the temporary ID to the new real database ID
      if (req.method.toLowerCase() === 'post' && response.data?.data?._id) {
        tempIdMap.set(req.id, response.data.data._id);
      }

      // If successful, remove from queue
      await removeFromQueue(req.id);
    } catch (err: any) {
      // If it fails due to network, stop processing.
      // If it fails due to 400/500, we probably should drop it or notify the user
      if (!err.response) {
        console.warn("Network still unavailable, stopping sync.");
        break; // Network error
      } else {
        console.error(
          `Failed to sync queued request ${req.id}, dropping it.`,
          err,
        );
        await removeFromQueue(req.id);
      }
    }
  }

  // Notify UI that sync is complete
  window.dispatchEvent(new CustomEvent("offline-sync-complete"));
  await pushFrequencyMapToServer();
};
