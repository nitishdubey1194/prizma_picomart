import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1).max(150),
  slug: z.string().min(1).max(150),
  description: z.string().max(255).optional(),
  parentId: z.number().int().positive().optional(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});