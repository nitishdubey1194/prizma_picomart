import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  sku: z.string().max(100).optional(),
  description: z.string().optional(),
  categoryId: z.number().int().positive().optional(),
  featured: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createVariantSchema = z.object({
  variantName: z.string().min(1).max(100),
  sku: z.string().max(100).optional(),
  price: z.number().nonnegative(),
  discountPrice: z.number().nonnegative().optional(),
  stockQty: z.number().int().nonnegative().optional(),
  maxBuyQty: z.number().int().positive().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

export const updateVariantSchema = createVariantSchema.partial();