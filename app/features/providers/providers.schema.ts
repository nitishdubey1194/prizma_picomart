import { z } from "zod";

export const createProviderSchema = z.object({
  name: z.string().min(1).max(150),
  slug: z.string().min(1).max(150),
  category: z.string().min(1).max(100),
  title: z.string().max(150).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().max(255).optional(),
  userId: z.string().uuid().optional(),
});

export const updateProviderSchema = createProviderSchema.partial().extend({
  isActive: z.boolean().optional(),
});