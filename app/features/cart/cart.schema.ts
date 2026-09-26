import { z } from "zod";

export const addToCartSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});