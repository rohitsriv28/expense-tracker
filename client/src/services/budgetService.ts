import apiClient from "./apiClient";
import { broadcastDataChange } from "./broadcastSync";
import type {
  Budget,
  MonthlyEnvelopeBudget,
  MonthlyEnvelopeSummary,
  BudgetStatus,
} from "../types";

export const addBudget = async (
  budget: Omit<Budget, "userId" | "_id">,
): Promise<string> => {
  const res = await apiClient.post("/budgets", budget);
  broadcastDataChange({ type: "BUDGET_UPDATED" });
  return res.data.data._id;
};

export const updateBudget = async (
  id: string,
  data: Partial<Budget>,
): Promise<void> => {
  await apiClient.put(`/budgets/${id}`, data);
  broadcastDataChange({ type: "BUDGET_UPDATED" });
};

export const deleteBudget = async (id: string): Promise<void> => {
  await apiClient.delete(`/budgets/${id}`);
  broadcastDataChange({ type: "BUDGET_UPDATED" });
};

export const getBudgets = async (): Promise<Budget[]> => {
  const res = await apiClient.get("/budgets");
  return res.data.data;
};

export function isMonthlyEnvelopeBudget(
  budget: Budget,
): budget is MonthlyEnvelopeBudget {
  return budget.type === "monthly_envelope";
}

export function calculateHealthScore(
  summaries: MonthlyEnvelopeSummary[],
): number {
  if (summaries.length === 0) return 100;
  const totalWeight = summaries.reduce(
    (acc, summary) => acc + summary.budget.amount,
    0,
  );
  if (totalWeight === 0) return 100;
  const withinWeight = summaries
    .filter((summary) => summary.status !== "exceeded")
    .reduce((acc, summary) => acc + summary.budget.amount, 0);
  return Math.round((withinWeight / totalWeight) * 100);
}

export function convertLegacyBudget(budget: any): MonthlyEnvelopeBudget {
  if (isMonthlyEnvelopeBudget(budget)) return budget;
  const date = new Date();
  return {
    _id: budget._id,
    userId: budget.userId,
    type: "monthly_envelope",
    name: "Legacy Budget",
    amount: (budget as any).limit ?? 0,
    month: date.getMonth(),
    year: date.getFullYear(),
    allocations: {},
    createdAt: budget.createdAt,
  };
}

export function calculateEnvelopeSummary(
  budget: MonthlyEnvelopeBudget,
  expenses: any[],
  categories: any[],
): MonthlyEnvelopeSummary {
  // Mock client-side implementation or duplicate backend logic
  const start = new Date(budget.year, budget.month, 1);
  const end = new Date(budget.year, budget.month + 1, 0, 23, 59, 59, 999);

  const matchingExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d >= start && d <= end;
  });

  const getStatus = (pct: number): BudgetStatus =>
    pct > 100
      ? "exceeded"
      : pct >= 90
        ? "danger"
        : pct >= 75
          ? "warning"
          : "safe";

  const labelToId = new Map<string, string>();
  categories.forEach((cat) => labelToId.set(cat.name.toLowerCase(), cat._id));

  const resolveId = (expense: any): string | undefined => {
    if (!expense.categoryId && !expense.category) return undefined;
    const cat = expense.categoryId || expense.category;

    // Check if the cat is already a valid category ID
    if (categories.some((c) => c._id === cat)) return cat;

    return labelToId.get(cat.toLowerCase());
  };

  const allCategoryIds = new Set([
    ...Object.keys(budget.allocations),
    ...(matchingExpenses.map((e) => resolveId(e)).filter(Boolean) as string[]),
  ]);

  const allocations = Array.from(allCategoryIds).map((categoryId) => {
    const allocated = budget.allocations[categoryId] || 0;
    const categoryExpenses = matchingExpenses.filter(
      (e) => resolveId(e) === categoryId,
    );
    const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
    const percentage =
      allocated > 0 ? (spent / allocated) * 100 : spent > 0 ? 100 : 0;
    return {
      categoryId,
      allocated,
      spent,
      percentage,
      status: getStatus(percentage),
    };
  });

  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocated, 0);
  const unallocatedAmount = Math.max(0, budget.amount - totalAllocated);

  const unallocatedExpenses = matchingExpenses.filter((e) => {
    const id = resolveId(e);
    return !id;
  });

  const unallocatedSpent = unallocatedExpenses.reduce(
    (sum, e) => sum + e.amount,
    0,
  );
  const unallocatedPercentage =
    unallocatedAmount > 0 ? (unallocatedSpent / unallocatedAmount) * 100 : 0;
  const unallocated = {
    amount: unallocatedAmount,
    spent: unallocatedSpent,
    remaining: unallocatedAmount - unallocatedSpent,
    percentage: unallocatedPercentage,
    status: getStatus(unallocatedPercentage),
  };

  const totalSpent = matchingExpenses.reduce((sum, e) => sum + e.amount, 0);
  const percentage = budget.amount > 0 ? (totalSpent / budget.amount) * 100 : 0;

  return {
    budget,
    totalSpent,
    remaining: budget.amount - totalSpent,
    percentage,
    status: getStatus(percentage),
    allocations,
    unallocated,
    expenses: matchingExpenses,
  };
}
