import type { Expense } from "../services/firebase";
import type { Category } from "../services/categoryService";

export interface CategoryData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

export interface ChartDataPoint {
  date: string; // Label (e.g., "Mon", "Jan", "Nov 2024")
  fullDate: string; // Tooltip/Sort key (YYYY-MM-DD or YYYY-MM)
  amount: number;
}

export type TimeRange = "7d" | "1m" | "3m" | "6m" | "1y";

export const aggregateCategoryData = (
  expenses: Expense[],
  categories: Category[],
): CategoryData[] => {
  const categoryMap = new Map<string, number>();

  expenses.forEach((expense) => {
    const categoryName = expense.category || "Uncategorized";
    const currentTotal = categoryMap.get(categoryName) || 0;
    categoryMap.set(categoryName, currentTotal + expense.amount);
  });

  const allColors = Object.keys(TAILWIND_COLORS).filter(
    (c) => !c.includes("gray") && !c.includes("slate"),
  );

  const usedColors = new Set<string>();

  // Map back to chart data format
  let data: CategoryData[] = Array.from(categoryMap.entries()).map(
    ([name, value]) => {
      const category = categories.find(
        (c) => c.label.toLowerCase() === name.toLowerCase(),
      );
      let colorClass = category?.color || "";

      if (colorClass && !(colorClass in TAILWIND_COLORS)) {
        console.warn(
          `Color class ${colorClass} not found in TAILWIND_COLORS. Falling back to bg-gray-500.`,
        );
        colorClass = "bg-gray-500";
      }

      return {
        name,
        value,
        color: colorClass,
      };
    },
  );

  // Sort by value descending so largest slices get distinct colors first
  data = data.sort((a, b) => b.value - a.value);

  // First pass: reserve explicitly assigned colors, ensure uniqueness
  data.forEach((item) => {
    if (item.color && !usedColors.has(item.color)) {
      usedColors.add(item.color);
    } else {
      item.color = ""; // If duplicate or missing, we rewrite to ensure distinct coloring
    }
  });

  // Second pass: fill distinct colors for all undefined/duplicate colors
  let colorIndex = 0;
  data.forEach((item) => {
    if (!item.color) {
      while (
        colorIndex < allColors.length &&
        usedColors.has(allColors[colorIndex])
      ) {
        colorIndex++;
      }

      if (colorIndex < allColors.length) {
        item.color = allColors[colorIndex];
        usedColors.add(item.color);
      } else {
        // Fallback deterministic assignments if palette is exhausted
        let hash = 0;
        for (let i = 0; i < item.name.length; i++) {
          hash = item.name.charCodeAt(i) + ((hash << 5) - hash);
        }
        item.color = allColors[Math.abs(hash) % allColors.length];
      }
    }
  });

  return data;
};

export const aggregateChartData = (
  expenses: Expense[],
  range: TimeRange,
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
        iterDate.getMonth() + 1,
      ).padStart(2, "0")}`; // YYYY-MM
      dataMap.set(key, 0);

      // Move to next month
      iterDate.setMonth(iterDate.getMonth() + 1);
    }

    expenses.forEach((e) => {
      const eDate = e.date.toDate();
      if (eDate >= startDate && eDate <= today) {
        const key = `${eDate.getFullYear()}-${String(
          eDate.getMonth() + 1,
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

// Helper: Tailwind to Hex map
export const TAILWIND_COLORS: Record<string, string> = {
  "bg-slate-400": "#94a3b8",
  "bg-slate-500": "#64748b",
  "bg-slate-600": "#475569",
  "bg-gray-400": "#9ca3af",
  "bg-gray-500": "#6b7280",
  "bg-gray-600": "#4b5563",
  "bg-red-400": "#f87171",
  "bg-red-500": "#ef4444",
  "bg-red-600": "#dc2626",
  "bg-orange-400": "#fb923c",
  "bg-orange-500": "#f97316",
  "bg-orange-600": "#ea580c",
  "bg-amber-400": "#fbbf24",
  "bg-amber-500": "#f59e0b",
  "bg-amber-600": "#d97706",
  "bg-yellow-400": "#facc15",
  "bg-yellow-500": "#eab308",
  "bg-yellow-600": "#ca8a04",
  "bg-lime-400": "#a3e635",
  "bg-lime-500": "#84cc16",
  "bg-lime-600": "#65a30d",
  "bg-green-400": "#4ade80",
  "bg-green-500": "#22c55e",
  "bg-green-600": "#16a34a",
  "bg-emerald-400": "#34d399",
  "bg-emerald-500": "#10b981",
  "bg-emerald-600": "#059669",
  "bg-teal-400": "#2dd4bf",
  "bg-teal-500": "#14b8a6",
  "bg-teal-600": "#0d9488",
  "bg-cyan-400": "#22d3ee",
  "bg-cyan-500": "#06b6d4",
  "bg-cyan-600": "#0891b2",
  "bg-sky-400": "#38bdf8",
  "bg-sky-500": "#0ea5e9",
  "bg-sky-600": "#0284c7",
  "bg-blue-400": "#60a5fa",
  "bg-blue-500": "#3b82f6",
  "bg-blue-600": "#2563eb",
  "bg-indigo-400": "#818cf8",
  "bg-indigo-500": "#6366f1",
  "bg-indigo-600": "#4f46e5",
  "bg-violet-400": "#a78bfa",
  "bg-violet-500": "#8b5cf6",
  "bg-violet-600": "#7c3aed",
  "bg-purple-400": "#c084fc",
  "bg-purple-500": "#a855f7",
  "bg-purple-600": "#9333ea",
  "bg-fuchsia-400": "#e879f9",
  "bg-fuchsia-500": "#d946ef",
  "bg-fuchsia-600": "#c026d3",
  "bg-pink-400": "#f472b6",
  "bg-pink-500": "#ec4899",
  "bg-pink-600": "#db2777",
  "bg-rose-400": "#fb7185",
  "bg-rose-500": "#f43f5e",
  "bg-rose-600": "#e11d48",
};
