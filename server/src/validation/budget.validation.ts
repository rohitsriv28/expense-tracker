import { z } from "zod";

export const createBudgetSchema = z.object({
  type: z.enum(["monthly_envelope"]).default("monthly_envelope").optional(),
  name: z.string().min(1).max(200).trim(),
  amount: z.number().nonnegative().max(10_000_000),
  month: z.number().int().min(0).max(11),
  year: z.number().int().min(2000).max(2100),
  allocations: z.record(z.string(), z.number().nonnegative()).optional(),
});

export const updateBudgetSchema = createBudgetSchema.partial();
