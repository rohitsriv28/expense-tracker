import { z } from "zod";

export const createExpenseSchema = z.object({
  amount: z.number().positive().max(10_000_000),
  remarks: z.string().min(1).max(500).trim(),
  date: z.string().datetime().or(z.date()),
  category: z.string().trim().optional(),
  tags: z.array(z.string().trim()).optional(),
  notes: z.string().max(2000).trim().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  category: z.string().optional(),
  sortBy: z.enum(["date", "amount"]).default("date"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});
