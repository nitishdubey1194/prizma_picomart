import { z } from "zod";

export const addImageSchema = z.object({
  imageUrl: z.string().url().max(255),
  isPrimary: z.boolean().optional(),
});