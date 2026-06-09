import { z } from "zod";

export const frequencyMapSchema = z.object({
  frequencyMap: z.record(z.string(), z.record(z.string(), z.number())).refine(
    (map) => Object.keys(map).length <= 500,
    {
      message: "Frequency map cannot exceed 500 top-level keys",
    }
  ),
});
