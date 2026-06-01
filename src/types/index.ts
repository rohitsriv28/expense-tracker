import type { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
  createdAt: Timestamp;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string;
  notes?: string;
  tags?: string[];
  goalBudgetId?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface Income {
  id: string;
  userId: string;
  amount: number;
  description: string;
  sourceId: string;
  date: string;
  isRecurring: boolean;
  recurringFrequency?: "weekly" | "biweekly" | "monthly";
  notes?: string;
  createdAt: Timestamp;
}

export interface IncomeSource {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  frequency: "monthly" | "weekly" | "biweekly" | "irregular";
  expectedAmount?: number;
  createdAt: Timestamp;
}

export type BudgetType = "recurring" | "goal";
export type BudgetPeriod = "weekly" | "monthly";
export type BudgetStatus = "safe" | "warning" | "danger" | "exceeded";

export interface RecurringBudget {
  id: string;
  userId: string;
  type: "recurring";
  name: string;
  categoryId: string;
  amount: number;
  period: BudgetPeriod;
  rollover: boolean;
  rolloverAmount: number;
  createdAt: Timestamp;
}

export interface GoalBudget {
  id: string;
  userId: string;
  type: "goal";
  name: string;
  emoji: string;
  totalAmount: number;
  startDate: string;
  endDate: string;
  allocations: Array<{ categoryId: string; amount: number }>;
  excludeFromMonthlyBudgets: boolean;
  createdAt: Timestamp;
}

export type Budget = RecurringBudget | GoalBudget;

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

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly" | "custom";
