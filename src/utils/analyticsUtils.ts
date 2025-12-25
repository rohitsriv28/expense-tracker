import type { Expense } from "../services/firebase";
import type { Category } from "../services/categoryService";

export interface CategoryData {
  name: string;
  value: number;
  color: string;
  [key: string]: any;
}

export interface ChartDataPoint {
  date: string; // Label (e.g., "Mon", "Jan", "Nov 2024")
  fullDate: string; // Tooltip/Sort key (YYYY-MM-DD or YYYY-MM)
  amount: number;
}

export type TimeRange = "7d" | "1m" | "3m" | "6m" | "1y";

export const aggregateCategoryData = (
  expenses: Expense[],
  categories: Category[]
): CategoryData[] => {
  const categoryMap = new Map<string, number>();

  expenses.forEach((expense) => {
    const categoryName = expense.category || "Uncategorized";
    const currentTotal = categoryMap.get(categoryName) || 0;
    categoryMap.set(categoryName, currentTotal + expense.amount);
  });

  // Map back to chart data format, with colors
  const data: CategoryData[] = Array.from(categoryMap.entries()).map(
    ([name, value]) => {
      const category = categories.find((c) => c.label === name);
      // Fallback color for unmapped/uncategorized (gray)
      // We need to resolve Tailwind classes to Hex for Recharts if we want precise control,
      // but Recharts assumes hex usually. However, we can use Cell mapping in Recharts.
      // For now, let's just pass the Tailwind class name if we implement a resolver,
      // OR we can rely on a fixed palette.
      // Actually, Recharts needs Hex. Let's create a simple mapping or use a default palette.

      // Let's assume we will pass the color class string and handle it in the component
      // or use a helper to get HSL/Hex.
      // For simplicity, let's return the tailwind class string as 'color'
      // and we will strip the 'bg-' prefix to maybe map to a hex map or just use a standard palette.

      return {
        name,
        value,
        color: category?.color || "bg-gray-400",
      };
    }
  );

  return data.sort((a, b) => b.value - a.value);
};

export const aggregateChartData = (
  expenses: Expense[],
  range: TimeRange
): ChartDataPoint[] => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const startDate = new Date(today);
  let mode: "daily" | "monthly" = "daily";

  // Determine start date and granularity
  switch (range) {
    case "7d":
      startDate.setDate(today.getDate() - 6); // 7 days inclusive
      mode = "daily";
      break;
    case "1m":
      startDate.setMonth(today.getMonth() - 1);
      mode = "daily";
      break;
    case "3m":
      startDate.setMonth(today.getMonth() - 3);
      mode = "monthly";
      break;
    case "6m":
      startDate.setMonth(today.getMonth() - 6);
      mode = "monthly";
      break;
    case "1y":
      startDate.setFullYear(today.getFullYear() - 1);
      mode = "monthly";
      break;
  }

  // Set aggregated data container
  const dataMap = new Map<string, number>();

  if (mode === "daily") {
    // Generate all days in range to fill gaps with 0
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
      dataMap.set(key, 0);
    }

    expenses.forEach((e) => {
      const eDate = e.date.toDate();
      if (eDate >= startDate && eDate <= today) {
        const key = eDate.toISOString().split("T")[0];
        // Account for expenses that might be slightly out of sync key generation if exact time match failed,
        // but YYYY-MM-DD check is robust.
        if (dataMap.has(key)) {
          dataMap.set(key, (dataMap.get(key) || 0) + e.amount);
        }
      }
    });

    // Format for chart
    return Array.from(dataMap.entries()).map(([key, amount]) => {
      const date = new Date(key);
      // For 1m range, show "D MMM" (e.g., "1 Nov"), for 7d show "Day" (e.g., "Mon")
      // But user might prefer consistency.
      const label =
        range === "7d"
          ? date.toLocaleDateString("en-US", { weekday: "short" })
          : date.toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
            });
      return { date: label, fullDate: key, amount };
    });
  } else {
    // Monthly mode
    // Generate all months in range
    // Start from the first day of the start month
    const iterDate = new Date(startDate);
    iterDate.setDate(1); // Set to 1st to avoid skipping months if today is 31st

    while (iterDate <= today) {
      const key = `${iterDate.getFullYear()}-${String(
        iterDate.getMonth() + 1
      ).padStart(2, "0")}`; // YYYY-MM
      dataMap.set(key, 0);

      // Move to next month
      iterDate.setMonth(iterDate.getMonth() + 1);
    }

    expenses.forEach((e) => {
      const eDate = e.date.toDate();
      if (eDate >= startDate && eDate <= today) {
        const key = `${eDate.getFullYear()}-${String(
          eDate.getMonth() + 1
        ).padStart(2, "0")}`;
        if (dataMap.has(key)) {
          dataMap.set(key, (dataMap.get(key) || 0) + e.amount);
        }
      }
    });

    return Array.from(dataMap.entries()).map(([key, amount]) => {
      const [year, month] = key.split("-").map(Number);
      const date = new Date(year, month - 1, 1);
      return {
        date: date.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }), // "Nov 24"
        fullDate: key,
        amount,
      };
    });
  }
};

export const aggregateDailyData = (expenses: Expense[]): ChartDataPoint[] => {
  // Legacy wrapper if needed, or we can replace usage.
  // Let's implement it using our new function for backward compat if I missed some usage,
  // but actually I'm replacing the charts, so I might not need this.
  // But to be safe vs legacy code in other files:
  return aggregateChartData(expenses, "7d");
};

// Helper: Tailwind to Hex map (simplified for major colors)
export const TAILWIND_COLORS: Record<string, string> = {
  "bg-red-500": "#ef4444",
  "bg-orange-500": "#f97316",
  "bg-amber-500": "#f59e0b",
  "bg-yellow-500": "#eab308",
  "bg-lime-500": "#84cc16",
  "bg-green-500": "#22c55e",
  "bg-emerald-500": "#10b981",
  "bg-teal-500": "#14b8a6",
  "bg-cyan-500": "#06b6d4",
  "bg-sky-500": "#0ea5e9",
  "bg-blue-500": "#3b82f6",
  "bg-indigo-500": "#6366f1",
  "bg-violet-500": "#8b5cf6",
  "bg-purple-500": "#a855f7",
  "bg-fuchsia-500": "#d946ef",
  "bg-pink-500": "#ec4899",
  "bg-rose-500": "#f43f5e",
  "bg-gray-500": "#6b7280",
  "bg-gray-400": "#9ca3af",
};
