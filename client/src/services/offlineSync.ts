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

export const failedStore = localforage.createInstance({
  name: "CashFlow",
  storeName: "failed_queue",
});

export interface QueuedRequest {
  id: string; // The temporary ID assigned locally
  method: string;
  url: string;
  data: any;
  headers: any;
  timestamp: number;
  status?: 'pending' | 'processing' | 'failed';
  retryCount?: number;
}

export const saveToCache = async (url: string, data: any) => {
  try {
    const envelope = {
      data,
      cachedAt: Date.now(),
      lastAccessed: Date.now(),
      stale: false
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
      return { data: entry.data, isStale: !!entry.stale };
    } else {
      await saveToCache(url, entry);
      return { data: entry, isStale: false };
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

export async function markCacheEntryStale(key: string): Promise<void> {
  const entry: any = await cacheStore.getItem(key);
  if (entry && typeof entry === 'object' && 'data' in entry) {
    entry.stale = true;
    await cacheStore.setItem(key, entry);
  }
}

export async function invalidateCacheByPrefix(prefix: string, mode: 'delete' | 'stale' = 'delete'): Promise<void> {
  const keys = await cacheStore.keys();
  const matching = keys.filter((k) => k.startsWith(prefix));
  await Promise.all(matching.map(async (k) => {
    if (mode === 'stale') {
      await markCacheEntryStale(k);
    } else {
      await cacheStore.removeItem(k);
    }
  }));
}

export const addToQueue = async (request: QueuedRequest) => {
  try {
    request.status = 'pending';
    request.retryCount = 0;
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

export async function resetStuckQueueItems(): Promise<void> {
  try {
    const keys = await queueStore.keys();
    for (const key of keys) {
      const item = await queueStore.getItem<QueuedRequest>(key);
      if (item?.status === 'processing') {
        item.status = 'pending';
        await queueStore.setItem(key, item);
      }
    }
  } catch (err) {
    console.error("Failed to reset stuck queue items", err);
  }
}

export const processSyncQueue = async (apiClient: AxiosInstance): Promise<{ synced: number, failed: number, failedItems: QueuedRequest[] } | void> => {
  if (!navigator.onLine) return { synced: 0, failed: 0, failedItems: [] };

  const queue = await getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0, failedItems: [] };

  console.log(`Processing ${queue.length} offline queued requests...`);
  
  const tempIdMap = new Map<string, string>();
  let synced = 0;

  for (const req of queue) {
    // Only process pending or failed (if not maxed out) items
    if (req.status === 'processing' || (req.retryCount && req.retryCount >= 3)) {
      continue;
    }

    try {
      req.status = 'processing';
      await queueStore.setItem(req.id, req);

      // Tested: offline create + offline edit of same item correctly resolves to single document.
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
      synced++;
    } catch (err: any) {
      // If it fails due to network, stop processing.
      if (!err.response) {
        console.warn("Network still unavailable, stopping sync.");
        req.status = 'pending';
        await queueStore.setItem(req.id, req);
        break; // Network error
      } else {
        console.error(
          `Failed to sync queued request ${req.id}.`,
          err,
        );
        req.status = 'failed';
        req.retryCount = (req.retryCount || 0) + 1;
        await queueStore.setItem(req.id, req);
      }
    }
  }

  const failedItems: QueuedRequest[] = [];
  // After processing, find items that are permanently failed
  for (const req of queue) {
    const updatedReq = await queueStore.getItem<QueuedRequest>(req.id);
    if (updatedReq && updatedReq.retryCount && updatedReq.retryCount >= 3 && updatedReq.status === 'failed') {
      failedItems.push(updatedReq);
      await failedStore.setItem(updatedReq.id, updatedReq);
      await queueStore.removeItem(updatedReq.id);
    }
  }

  // Notify UI that sync is complete
  window.dispatchEvent(new CustomEvent("offline-sync-complete"));
  await pushFrequencyMapToServer();

  return { synced, failed: failedItems.length, failedItems };
};

export async function getFailedQueueItems(): Promise<QueuedRequest[]> {
  const items: QueuedRequest[] = [];
  await failedStore.iterate((value: QueuedRequest) => {
    items.push(value);
  });
  return items;
}

export async function retryFailedItems(): Promise<void> {
  const items = await getFailedQueueItems();
  for (const item of items) {
    item.retryCount = 0;
    item.status = 'pending';
    await queueStore.setItem(item.id, item);
    await failedStore.removeItem(item.id);
  }
}

export async function clearFailedItems(): Promise<void> {
  await failedStore.clear();
}

export const refreshStore = localforage.createInstance({
  name: "CashFlow",
  storeName: "refresh_queue",
});

export async function addToRefreshQueue(url: string): Promise<void> {
  await refreshStore.setItem(url, { timestamp: Date.now() });
}

export async function processRefreshQueue(fetchFn: (url: string) => Promise<any>): Promise<void> {
  const keys = await refreshStore.keys();
  for (const url of keys) {
    try {
      await fetchFn(url);
      await refreshStore.removeItem(url);
    } catch (err) {
      console.error(`Failed to refresh url: ${url}`, err);
    }
  }
}

export async function injectOptimisticItemIntoCache(
  urlPrefix: string,
  item: Record<string, unknown>
): Promise<void> {
  const keys = await cacheStore.keys();
  const matching = keys.filter((k) => k.startsWith(urlPrefix));
  for (const k of matching) {
    const entry: any = await cacheStore.getItem(k);
    if (entry && typeof entry === 'object' && 'data' in entry) {
      if (Array.isArray(entry.data)) {
        entry.data = [item, ...entry.data];
        entry.stale = true;
        await cacheStore.setItem(k, entry);
      } else if (entry.data && Array.isArray(entry.data.data)) {
        entry.data.data = [item, ...entry.data.data];
        entry.stale = true;
        await cacheStore.setItem(k, entry);
      }
    }
  }
}

export async function updateItemInCache(urlPrefix: string, id: string, updates: Record<string, unknown>): Promise<void> {
  const keys = await cacheStore.keys();
  const matching = keys.filter((k) => k.startsWith(urlPrefix));
  for (const k of matching) {
    const entry: any = await cacheStore.getItem(k);
    if (entry && typeof entry === 'object' && 'data' in entry) {
      const updateArray = (arr: any[]) => {
        const idx = arr.findIndex((item) => item._id === id);
        if (idx !== -1) arr[idx] = { ...arr[idx], ...updates };
      };
      
      if (Array.isArray(entry.data)) {
        updateArray(entry.data);
        entry.stale = true;
        await cacheStore.setItem(k, entry);
      } else if (entry.data && Array.isArray(entry.data.data)) {
        updateArray(entry.data.data);
        entry.stale = true;
        await cacheStore.setItem(k, entry);
      }
    }
  }
}

export async function deleteItemFromCache(urlPrefix: string, id: string): Promise<void> {
  const keys = await cacheStore.keys();
  const matching = keys.filter((k) => k.startsWith(urlPrefix));
  for (const k of matching) {
    const entry: any = await cacheStore.getItem(k);
    if (entry && typeof entry === 'object' && 'data' in entry) {
      if (Array.isArray(entry.data)) {
        entry.data = entry.data.filter((item: any) => item._id !== id);
        entry.stale = true;
        await cacheStore.setItem(k, entry);
      } else if (entry.data && Array.isArray(entry.data.data)) {
        entry.data.data = entry.data.data.filter((item: any) => item._id !== id);
        entry.stale = true;
        await cacheStore.setItem(k, entry);
      }
    }
  }
}
