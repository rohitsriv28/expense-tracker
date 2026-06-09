import type { Category } from "../types";

import apiClient from "../services/apiClient";

const STORAGE_KEY = "expense_frequency_map";

type FrequencyMap = Record<string, Record<string, number>>;

function readMap(): FrequencyMap {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "{}",
    ) as FrequencyMap;
  } catch {
    return {};
  }
}

function evictLowFrequencyEntries(
  map: FrequencyMap,
  maxEntries: number = 200
): FrequencyMap {
  const keys = Object.keys(map);
  if (keys.length <= maxEntries) return map;

  const sortedKeys = keys.sort((a, b) => {
    const sumA = Object.values(map[a]).reduce((acc, count) => acc + count, 0);
    const sumB = Object.values(map[b]).reduce((acc, count) => acc + count, 0);
    return sumA - sumB;
  });

  const keysToRemove = sortedKeys.slice(0, keys.length - maxEntries);
  const newMap = { ...map };
  for (const key of keysToRemove) {
    delete newMap[key];
  }
  return newMap;
}

export function getSuggestedCategory(
  description: string,
  categories: Category[],
): Category | null {
  const normalized = description.trim().toLowerCase();
  if (!normalized) return null;

  const entry = readMap()[normalized];
  if (!entry) return null;

  const topCategoryId = Object.entries(entry).sort(
    ([, a], [, b]) => b - a,
  )[0]?.[0];
  return categories.find((category) => category._id === topCategoryId) ?? null;
}

export function recordExpense(description: string, categoryId: string): void {
  const normalized = description.trim().toLowerCase();
  if (!normalized || !categoryId) return;

  let map = readMap();
  if (!map[normalized]) map[normalized] = {};
  map[normalized][categoryId] = (map[normalized][categoryId] || 0) + 1;
  
  map = evictLowFrequencyEntries(map, 200);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export async function pushFrequencyMapToServer(): Promise<void> {
  try {
    const map = readMap();
    if (Object.keys(map).length === 0) return;
    
    await apiClient.put("/users/me/frequency-map", { frequencyMap: map });
  } catch (error) {
    console.warn("Failed to push frequency map to server", error);
  }
}

export async function pullFrequencyMapFromServer(): Promise<void> {
  try {
    const { data } = await apiClient.get("/users/me/frequency-map");
    const serverMap = data?.data as FrequencyMap;
    if (!serverMap || Object.keys(serverMap).length === 0) return;

    let localMap = readMap();
    
    // Merge server into local using Math.max
    for (const [desc, cats] of Object.entries(serverMap)) {
      if (!localMap[desc]) localMap[desc] = {};
      for (const [catId, count] of Object.entries(cats)) {
        localMap[desc][catId] = Math.max(localMap[desc][catId] ?? 0, count);
      }
    }

    localMap = evictLowFrequencyEntries(localMap, 200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localMap));
  } catch (error) {
    console.warn("Failed to pull frequency map from server", error);
  }
}
