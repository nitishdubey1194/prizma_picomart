import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().min(1).max(150),
  slug: z.string().min(1).max(150),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive(),
  price: z.number().nonnegative().optional(),
  bufferMinutes: z.number().int().nonnegative().optional(),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  isActive: z.boolean().optional(),
});