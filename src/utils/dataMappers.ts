import { Timestamp } from "firebase/firestore";
import type { Expense as LegacyExpense } from "../services/firebase";
import type { Income as LegacyIncome } from "../services/incomeService";
import type { Category as LegacyCategory } from "../services/categoryService";
import type { Expense, Income, Category } from "../types";
import { TAILWIND_COLORS } from "./analyticsUtils";
import { toLocalISODateString } from "./dateUtils";

interface TimestampLike {
  toDate: () => Date;
}

export function toDate(value: Date | TimestampLike | string): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(`${value}T00:00:00`);
  return value.toDate();
}

export function expenseDate(expense: LegacyExpense): Date {
  return toDate(expense.date);
}

export function incomeDate(income: LegacyIncome): Date {
  return toDate(income.date);
}

export function expenseDescription(expense: LegacyExpense): string {
  return expense.remarks || "Untitled expense";
}

export function categoryHex(category?: LegacyCategory): string {
  if (!category) return "#94a3b8";
  if (category.color.startsWith("#")) return category.color;
  return TAILWIND_COLORS[category.color] || "#94a3b8";
}

export function categoryName(category?: LegacyCategory): string {
  return category?.label || "Uncategorized";
}

export function findCategory(
  categories: LegacyCategory[],
  categoryValue?: string,
): LegacyCategory | undefined {
  if (!categoryValue) return undefined;
  const needle = categoryValue.trim().toLowerCase();

  // Try exact ID match first
  const byId = categories.find((c) => c.id === categoryValue);
  if (byId) return byId;

  // Try case-insensitive label match
  return categories.find((c) => c.label.trim().toLowerCase() === needle);
}

/**
 * Hard-coded lookup table mapping old expense category labels to icon + color.
 * This ensures that even if the user's Firestore categories collection is empty,
 * renamed, or out-of-sync, old expenses still render with correct visuals.
 */
const BUILTIN_CATEGORY_VISUALS: Record<
  string,
  { icon: string; color: string }
> = {
  "food & drink": { icon: "Coffee", color: "#ea580c" },
  food: { icon: "Coffee", color: "#ea580c" },
  transport: { icon: "Car", color: "#475569" },
  shopping: { icon: "ShoppingBag", color: "#e11d48" },
  bills: { icon: "Home", color: "#059669" },
  entertainment: { icon: "Gamepad2", color: "#dc2626" },
  healthcare: { icon: "Heart", color: "#f87171" },
  other: { icon: "MoreHorizontal", color: "#64748b" },
};

/**
 * Resolves icon and color for an expense, even when the category can't be found
 * in the live categories list. Falls back to BUILTIN_CATEGORY_VISUALS so old
 * Firestore data always displays with proper icons and colors.
 */
export function resolveExpenseVisuals(
  categories: LegacyCategory[],
  expenseCategoryValue?: string,
): { categoryName: string; icon: string; color: string } {
  const category = findCategory(categories, expenseCategoryValue);

  if (category) {
    return {
      categoryName: category.label,
      icon: category.icon || "MoreHorizontal",
      color: categoryHex(category),
    };
  }

  // No match in live categories — try the hardcoded lookup
  const needle = (expenseCategoryValue || "").trim().toLowerCase();
  const builtin = BUILTIN_CATEGORY_VISUALS[needle];
  if (builtin) {
    return {
      categoryName: expenseCategoryValue!,
      icon: builtin.icon,
      color: builtin.color,
    };
  }

  // Completely unknown category — still show the raw name
  return {
    categoryName: expenseCategoryValue || "Uncategorized",
    icon: "MoreHorizontal",
    color: "#94a3b8",
  };
}

export function normalizeExpense(expense: LegacyExpense): Expense {
  const date = expenseDate(expense);
  return {
    id: expense.id ?? crypto.randomUUID(),
    userId: expense.userId,
    amount: expense.amount,
    description: expenseDescription(expense),
    categoryId: expense.category || "uncategorized",
    date: toLocalISODateString(date),
    tags: expense.tags,
    createdAt: expense.createdAt ?? Timestamp.fromDate(date),
    updatedAt: expense.updatedAt,
  };
}

export function normalizeIncome(income: LegacyIncome): Income {
  const date = incomeDate(income);
  return {
    id: income.id ?? crypto.randomUUID(),
    userId: income.userId,
    amount: income.amount,
    description: income.source,
    sourceId: income.source,
    date: toLocalISODateString(date),
    isRecurring: false,
    createdAt: income.createdAt ?? Timestamp.fromDate(date),
  };
}

export function normalizeCategory(
  category: LegacyCategory,
  userId: string,
): Category {
  return {
    id: category.id,
    userId,
    name: category.label,
    icon: category.icon || "MoreHorizontal",
    color: categoryHex(category),
    sortOrder: 0,
    isDefault: category.type === "default",
    createdAt: Timestamp.now(),
  };
}
