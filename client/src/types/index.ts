export interface User {
  _id: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface Category {
  _id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
  createdAt: string;
}

export interface Expense {
  _id: string;
  userId: string;
  amount: number;
  remarks: string;
  category?: string;
  date: string;
  editCount: number;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Income {
  _id: string;
  userId: string;
  amount: number;
  description: string;
  source: string;
  sourceId?: string;
  date: string;
  isRecurring: boolean;
  recurringFrequency?: "weekly" | "biweekly" | "monthly";
  notes?: string;
  createdAt: string;
}

export interface IncomeSource {
  _id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  frequency: "monthly" | "weekly" | "biweekly" | "irregular";
  expectedAmount?: number;
  createdAt: string;
}

export type BudgetType = "recurring" | "goal";
export type BudgetPeriod = "weekly" | "monthly";
export type BudgetStatus = "safe" | "warning" | "danger" | "exceeded";

export interface MonthlyEnvelopeBudget {
  _id: string;
  userId: string;
  type: "monthly_envelope";
  name: string;
  amount: number;
  month: number;
  year: number;
  allocations: Record<string, number>;
  createdAt: string;
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
