import { z } from "zod";

export const checkoutSchema = z.object({
  addressId: z.number().int().positive(),
  paymentMethod: z.enum(["cod", "upi", "card", "wallet", "netbanking"]),
  deliveryNotes: z.string().max(255).optional(),
});
export const cancelOrderSchema = z.object({
  reason: z.string().max(255).optional(),
});