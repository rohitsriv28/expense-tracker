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

export interface MonthlyEnvelopeBudget {
  id: string;
  userId: string;
  type: "monthly_envelope";
  name: string;
  amount: number;
  month: number;
  year: number;
  allocations: Record<string, number>;
  createdAt: Timestamp;
}
export type Budget = MonthlyEnvelopeBudget;

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

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly" | "custom";
