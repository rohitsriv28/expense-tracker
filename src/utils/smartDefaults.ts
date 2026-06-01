import type { Category } from "../services/categoryService";

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
  return categories.find((category) => category.id === topCategoryId) ?? null;
}

export function recordExpense(description: string, categoryId: string): void {
  const normalized = description.trim().toLowerCase();
  if (!normalized || !categoryId) return;

  const map = readMap();
  if (!map[normalized]) map[normalized] = {};
  map[normalized][categoryId] = (map[normalized][categoryId] || 0) + 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}
