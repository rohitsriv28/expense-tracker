import apiClient from "./apiClient";
import { broadcastDataChange } from "./broadcastSync";

export interface Expense {
  _id: string; // MongoDB ObjectId string (replaces Firestore doc id)
  userId: string;
  amount: number;
  remarks: string;
  date: string; // ISO date string (replaces Firestore Timestamp)
  category?: string;
  editCount: number;
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFilters {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  sortBy?: "date" | "amount";
  sortDirection?: "asc" | "desc";
}

export interface PaginatedExpenses {
  expenses: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

export const addExpense = async (
  data: Omit<
    Expense,
    "_id" | "userId" | "createdAt" | "updatedAt" | "editCount"
  >,
) => {
  const res = await apiClient.post("/expenses", data);
  broadcastDataChange({ type: 'EXPENSE_CREATED' });
  return res.data.data as Expense;
};

export const updateExpense = async (id: string, data: Partial<Expense>) => {
  const res = await apiClient.put(`/expenses/${id}`, data);
  broadcastDataChange({ type: 'EXPENSE_UPDATED' });
  return res.data.data as Expense;
};

export const deleteExpense = async (id: string) => {
  await apiClient.delete(`/expenses/${id}`);
  broadcastDataChange({ type: 'EXPENSE_DELETED' });
};

export const getExpenses = async (
  filters?: ExpenseFilters,
  page = 1,
  limit = 10,
): Promise<PaginatedExpenses> => {
  const params = {
    page,
    limit,
    ...(filters?.category &&
      filters.category !== "all" && { category: filters.category }),
    ...(filters?.startDate && { startDate: filters.startDate.toISOString() }),
    ...(filters?.endDate && { endDate: filters.endDate.toISOString() }),
    ...(filters?.sortBy && { sortBy: filters.sortBy }),
    ...(filters?.sortDirection && { sortDir: filters.sortDirection }),
  };
  const res = await apiClient.get("/expenses", { params });
  return res.data.data;
};

export const getAllExpenses = async (
  filters?: ExpenseFilters,
): Promise<Expense[]> => {
  const params = {
    ...(filters?.category && { category: filters.category }),
    ...(filters?.startDate && { startDate: filters.startDate.toISOString() }),
    ...(filters?.endDate && { endDate: filters.endDate.toISOString() }),
  };
  const res = await apiClient.get("/expenses/all", { params });
  return res.data.data as Expense[];
};
