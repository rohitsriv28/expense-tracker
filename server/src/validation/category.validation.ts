import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  color: z.string().min(1).max(50).trim(),
  icon: z.string().min(1).max(50).trim(),
});

export const updateCategorySchema = createCategorySchema.partial();
