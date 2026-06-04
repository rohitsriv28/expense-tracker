import { db, auth } from "./firebase";
import type { Expense } from "./firebase";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  doc,
  orderBy,
  deleteDoc,
  Timestamp,
  updateDoc,
  getDocs,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";
import type { Category } from "./categoryService";

export type BudgetType = "recurring" | "goal";
export type BudgetPeriod = "weekly" | "monthly";
export type BudgetStatus = "safe" | "warning" | "danger" | "exceeded";

export interface LegacyBudget {
  id?: string;
  name: string;
  limit: number;
  type: "week" | "month" | "trip";
  startDate: Timestamp;
  endDate: Timestamp;
  userId: string;
  createdAt?: Timestamp;
}

export interface MonthlyEnvelopeBudget {
  id?: string;
  userId: string;
  type: "monthly_envelope";
  name: string;
  amount: number;
  month: number;
  year: number;
  allocations: Record<string, number>;
  createdAt?: Timestamp;
}

export type Budget = LegacyBudget | MonthlyEnvelopeBudget;

export interface MonthlyEnvelopeSummary {
  budget: MonthlyEnvelopeBudget;
  totalSpent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
  allocations: Array<{
    categoryId: string;
    allocated: number;
    spent: number;
    percentage: number;
    status: BudgetStatus;
  }>;
  unallocated: {
    amount: number;
    spent: number;
    remaining: number;
    percentage: number;
    status: BudgetStatus;
  };
  expenses: Expense[];
}

function budgetCollection(userId: string) {
  return collection(db, "users", userId, "budgets");
}

export const addBudget = async (
  budget: Omit<Budget, "userId" | "id">,
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const userBudgetsRef = budgetCollection(user.uid);
  const docRef = await addDoc(userBudgetsRef, {
    ...budget,
    userId: user.uid,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateBudget = async (
  id: string,
  data: Partial<Budget>,
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const budgetRef = doc(db, "users", user.uid, "budgets", id);
  await updateDoc(budgetRef, data);
};

export const deleteBudget = async (id: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const budgetRef = doc(db, "users", user.uid, "budgets", id);
  await deleteDoc(budgetRef);
};

function mapBudgetDocs(
  docs: Array<{ id: string; data: () => unknown }>,
): Budget[] {
  return docs.map(
    (document) =>
      ({
        id: document.id,
        ...(document.data() as Record<string, unknown>),
      }) as Budget,
  );
}

export function getBudgets(userId: string): Promise<Budget[]>;
export function getBudgets(
  userId: string,
  callback: (budgets: Budget[]) => void,
): Unsubscribe;
export function getBudgets(
  userId: string,
  callback?: (budgets: Budget[]) => void,
): Promise<Budget[]> | Unsubscribe {
  const userBudgetsRef = budgetCollection(userId);
  const q = query(userBudgetsRef, orderBy("createdAt", "desc"));

  if (callback) {
    return onSnapshot(
      q,
      (snapshot) => callback(mapBudgetDocs(snapshot.docs)),
      (error: FirestoreError) => {
        console.error("Error fetching budgets:", error);
        callback([]);
      },
    );
  }

  return getDocs(q).then((snapshot) => mapBudgetDocs(snapshot.docs));
}

export function isMonthlyEnvelopeBudget(
  budget: Budget,
): budget is MonthlyEnvelopeBudget {
  return budget.type === "monthly_envelope";
}

export function convertLegacyBudget(budget: Budget): MonthlyEnvelopeBudget {
  if (isMonthlyEnvelopeBudget(budget)) return budget;

  // Safely resolve a date from the legacy budget's startDate field.
  // It could be a Firestore Timestamp, a plain string, or missing entirely.
  let date: Date;
  try {
    const raw = (budget as unknown as Record<string, unknown>).startDate;
    if (
      raw &&
      typeof raw === "object" &&
      typeof (raw as Timestamp).toDate === "function"
    ) {
      date = (raw as Timestamp).toDate();
    } else if (typeof raw === "string") {
      date = new Date(raw);
    } else {
      date = new Date();
    }
    // Guard against Invalid Date
    if (isNaN(date.getTime())) date = new Date();
  } catch {
    date = new Date();
  }

  return {
    id: budget.id,
    userId: budget.userId,
    type: "monthly_envelope",
    name:
      budget.name ||
      ((budget as unknown as Record<string, unknown>).name as string) ||
      "Legacy Budget",
    amount:
      budget.limit ??
      ((budget as unknown as Record<string, unknown>).totalAmount as number) ??
      0,
    month: date.getMonth(),
    year: date.getFullYear(),
    allocations: {},
    createdAt: budget.createdAt,
  };
}

function expenseDate(expense: Expense): Date {
  return expense.date.toDate();
}

function isExpenseInRange(expense: Expense, start: Date, end: Date): boolean {
  const date = expenseDate(expense);
  return date >= start && date <= end;
}

export function getExpensesForEnvelopePeriod(
  expenses: Expense[],
  budget: MonthlyEnvelopeBudget,
): Expense[] {
  const start = new Date(budget.year, budget.month, 1);
  const end = new Date(budget.year, budget.month + 1, 0, 23, 59, 59, 999);

  return expenses.filter((expense) => {
    return isExpenseInRange(expense, start, end);
  });
}

export function calculateEnvelopeSummary(
  budget: MonthlyEnvelopeBudget,
  expenses: Expense[],
  categories: Category[] = [],
): MonthlyEnvelopeSummary {
  const matchingExpenses = getExpensesForEnvelopePeriod(expenses, budget);

  const getStatus = (pct: number): BudgetStatus =>
    pct > 100
      ? "exceeded"
      : pct >= 90
        ? "danger"
        : pct >= 75
          ? "warning"
          : "safe";

  // Build a label→ID lookup so we can match expense.category (label) to allocation keys (IDs)
  const labelToId = new Map<string, string>();
  categories.forEach((cat) => {
    labelToId.set(cat.label.toLowerCase(), cat.id);
  });

  // Resolve an expense's category field to the corresponding category ID
  const resolveId = (expense: Expense): string | undefined => {
    if (!expense.category) return undefined;
    // Direct match (already an ID)
    if (budget.allocations[expense.category] !== undefined)
      return expense.category;
    // Lookup by label
    return labelToId.get(expense.category.toLowerCase());
  };

  // Calculate allocations
  const allocations = Object.entries(budget.allocations).map(
    ([categoryId, allocated]) => {
      const categoryExpenses = matchingExpenses.filter(
        (e) => resolveId(e) === categoryId,
      );
      const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
      return {
        categoryId,
        allocated,
        spent,
        percentage,
        status: getStatus(percentage),
      };
    },
  );

  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocated, 0);
  const unallocatedAmount = Math.max(0, budget.amount - totalAllocated);

  // Calculate unallocated spent (spending in categories that have no explicit allocation)
  const allocatedCategoryIds = new Set(Object.keys(budget.allocations));
  const unallocatedExpenses = matchingExpenses.filter((e) => {
    const id = resolveId(e);
    return !id || !allocatedCategoryIds.has(id);
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
