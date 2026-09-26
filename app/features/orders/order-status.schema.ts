import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending", "confirmed", "processing", "shipped",
    "out_for_delivery", "delivered", "cancelled", "returned", "failed",
  ]),
  remarks: z.string().max(255).optional(),
});