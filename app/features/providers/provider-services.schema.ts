import { z } from "zod";

export const linkServiceSchema = z.object({
  serviceId: z.number().int().positive(),
  priceOverride: z.number().nonnegative().optional(),
  durationOverrideMinutes: z.number().int().positive().optional(),
});