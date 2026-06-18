import { z } from "zod";

export const createIncomeSchema = z.object({
  amount: z.number().positive().max(10_000_000),
  source: z.string().min(1).max(100).trim(),
  sourceId: z.string().optional(),
  date: z.string().datetime().or(z.date()),
  description: z.string().max(500).trim().optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.enum(["weekly", "biweekly", "monthly"]).optional(),
  notes: z.string().max(2000).trim().optional(),
});

export const updateIncomeSchema = createIncomeSchema.partial();

export const createIncomeSourceSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  icon: z.string().min(1).trim(),
  color: z.string().min(1).trim(),
  frequency: z.enum(["monthly", "weekly", "biweekly", "irregular"]),
  expectedAmount: z.number().nonnegative().optional(),
});

export const updateIncomeSourceSchema = createIncomeSourceSchema.partial();
