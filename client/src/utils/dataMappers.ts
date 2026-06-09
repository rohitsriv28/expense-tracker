import type { Category, Expense, Income } from "../types";

export function expenseDate(expense: Expense): Date {
  return new Date(expense.date);
}

export function incomeDate(income: Income): Date {
  return new Date(income.date);
}

export function resolveExpenseVisuals(
  categories: Category[],
  categoryName: string,
): { categoryName: string; color: string; icon: string } {
  if (!categoryName)
    return {
      categoryName: "Unknown",
      color: "#94a3b8",
      icon: "MoreHorizontal",
    };

  const category = categories.find(
    (c) =>
      c.name.toLowerCase() === categoryName.toLowerCase() ||
      c._id === categoryName,
  );
  if (category) {
    return {
      categoryName: category.name,
      color: categoryHex(category),
      icon: category.icon || "Circle",
    };
  }
  return { categoryName, color: "#94a3b8", icon: "MoreHorizontal" }; // Default slate color
}

const TAILWIND_COLORS: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  lime: "#84cc16",
  green: "#22c55e",
  emerald: "#10b981",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  sky: "#0ea5e9",
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  pink: "#ec4899",
  rose: "#f43f5e",
  gray: "#6b7280",
  slate: "#64748b",
};

export function categoryHex(category: Category): string {
  if (category.color.startsWith("#")) return category.color;

  // Extract color name from bg-color-500
  const match = category.color.match(/bg-([a-z]+)-\d00/);
  if (match && TAILWIND_COLORS[match[1]]) {
    return TAILWIND_COLORS[match[1]];
  }

  return "#94a3b8";
}

export function findCategory(
  categories: Category[],
  idOrName?: string,
): Category | undefined {
  if (!idOrName) return undefined;
  return categories.find(
    (c) =>
      c._id === idOrName || c.name.toLowerCase() === idOrName.toLowerCase(),
  );
}
