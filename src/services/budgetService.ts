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
import { toLocalISODateString } from "../utils/dateUtils";

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

export interface RecurringBudget {
  id?: string;
  userId: string;
  type: "recurring";
  name: string;
  categoryId: string;
  amount: number;
  period: BudgetPeriod;
  rollover: boolean;
  rolloverAmount: number;
  createdAt?: Timestamp;
}

export interface GoalBudget {
  id?: string;
  userId: string;
  type: "goal";
  name: string;
  emoji: string;
  totalAmount: number;
  startDate: string;
  endDate: string;
  allocations: Array<{ categoryId: string; amount: number }>;
  excludeFromMonthlyBudgets: boolean;
  createdAt?: Timestamp;
}

export type Budget = LegacyBudget | RecurringBudget | GoalBudget;

export interface BudgetPeriodSummary {
  budget: RecurringBudget;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
  rolloverApplied: number;
  expenses: Expense[];
}

export interface GoalBudgetSummary {
  budget: GoalBudget;
  totalSpent: number;
  remaining: number;
  percentage: number;
  status: "on-track" | "warning" | "exceeded";
  byCategory: Array<{ categoryId: string; allocated: number; spent: number }>;
  daysRemaining: number;
  projectedTotal: number;
  expenses: Expense[];
}

function budgetCollection(userId: string) {
  return collection(db, "budgets", userId, "userBudgets");
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

  const budgetRef = doc(db, "budgets", user.uid, "userBudgets", id);
  await updateDoc(budgetRef, data);
};

export const deleteBudget = async (id: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const budgetRef = doc(db, "budgets", user.uid, "userBudgets", id);
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

export function isRecurringBudget(budget: Budget): budget is RecurringBudget {
  return budget.type === "recurring";
}

export function isGoalBudget(budget: Budget): budget is GoalBudget {
  return budget.type === "goal";
}

export function convertLegacyBudget(
  budget: Budget,
): RecurringBudget | GoalBudget {
  if (isRecurringBudget(budget) || isGoalBudget(budget)) return budget;

  if (budget.type === "trip") {
    return {
      id: budget.id,
      userId: budget.userId,
      type: "goal",
      name: budget.name,
      emoji: "🎯",
      totalAmount: budget.limit,
      startDate: toLocalISODateString(budget.startDate.toDate()),
      endDate: toLocalISODateString(budget.endDate.toDate()),
      allocations: [],
      excludeFromMonthlyBudgets: true,
      createdAt: budget.createdAt,
    };
  }

  return {
    id: budget.id,
    userId: budget.userId,
    type: "recurring",
    name: budget.name,
    categoryId: "all",
    amount: budget.limit,
    period: budget.type === "week" ? "weekly" : "monthly",
    rollover: false,
    rolloverAmount: 0,
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

export function getExpensesForGoal(
  expenses: Expense[],
  goal: GoalBudget,
): Expense[] {
  const start = new Date(`${goal.startDate}T00:00:00`);
  const end = new Date(`${goal.endDate}T23:59:59`);
  return expenses.filter((expense) => {
    if (expense.goalBudgetId === goal.id) return true;
    return isExpenseInRange(expense, start, end);
  });
}

export function isExpenseExcludedFromMonthly(
  expense: Expense,
  goals: GoalBudget[],
): boolean {
  return goals.some(
    (goal) =>
      goal.excludeFromMonthlyBudgets &&
      (expense.goalBudgetId === goal.id ||
        getExpensesForGoal([expense], goal).length > 0),
  );
}

export function getExpensesForBudgetPeriod(
  expenses: Expense[],
  budget: RecurringBudget,
  period?: { start: Date; end: Date },
  goals: GoalBudget[] = [],
): Expense[] {
  const now = new Date();
  const start =
    period?.start ??
    (budget.period === "weekly"
      ? new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - now.getDay() + 1,
        )
      : new Date(now.getFullYear(), now.getMonth(), 1));
  const end =
    period?.end ??
    (budget.period === "weekly"
      ? new Date(
          start.getFullYear(),
          start.getMonth(),
          start.getDate() + 6,
          23,
          59,
          59,
          999,
        )
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));

  return expenses.filter((expense) => {
    const categoryMatches =
      budget.categoryId === "all" || expense.category === budget.categoryId;
    return (
      categoryMatches &&
      isExpenseInRange(expense, start, end) &&
      !isExpenseExcludedFromMonthly(expense, goals)
    );
  });
}

export function calculateBudgetSummary(
  budget: RecurringBudget,
  expenses: Expense[],
  period: { start: Date; end: Date },
): BudgetPeriodSummary {
  const matchingExpenses = getExpensesForBudgetPeriod(expenses, budget, period);
  const rolloverApplied = budget.rollover ? budget.rolloverAmount : 0;
  const effectiveAmount = budget.amount + rolloverApplied;
  const spent = matchingExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const remaining = effectiveAmount - spent;
  const percentage = effectiveAmount > 0 ? (spent / effectiveAmount) * 100 : 0;
  const status: BudgetStatus =
    percentage > 100
      ? "exceeded"
      : percentage >= 90
        ? "danger"
        : percentage >= 75
          ? "warning"
          : "safe";

  return {
    budget,
    spent,
    remaining,
    percentage,
    status,
    rolloverApplied,
    expenses: matchingExpenses,
  };
}

export function calculateGoalSummary(
  budget: GoalBudget,
  expenses: Expense[],
): GoalBudgetSummary {
  const goalExpenses = getExpensesForGoal(expenses, budget);
  const totalSpent = goalExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const remaining = budget.totalAmount - totalSpent;
  const percentage =
    budget.totalAmount > 0 ? (totalSpent / budget.totalAmount) * 100 : 0;
  const today = new Date();
  const start = new Date(`${budget.startDate}T00:00:00`);
  const end = new Date(`${budget.endDate}T23:59:59`);
  const elapsedDays = Math.max(
    1,
    Math.ceil((today.getTime() - start.getTime()) / 86400000),
  );
  const daysRemaining = Math.max(
    0,
    Math.ceil((end.getTime() - today.getTime()) / 86400000),
  );
  const dailyAverage = totalSpent / elapsedDays;

  return {
    budget,
    totalSpent,
    remaining,
    percentage,
    status:
      percentage > 100 ? "exceeded" : percentage >= 85 ? "warning" : "on-track",
    byCategory: budget.allocations.map((allocation) => ({
      categoryId: allocation.categoryId,
      allocated: allocation.amount,
      spent: goalExpenses
        .filter((expense) => expense.category === allocation.categoryId)
        .reduce((sum, expense) => sum + expense.amount, 0),
    })),
    daysRemaining,
    projectedTotal: totalSpent + dailyAverage * daysRemaining,
    expenses: goalExpenses,
  };
}

export function calculateHealthScore(summaries: BudgetPeriodSummary[]): number {
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
