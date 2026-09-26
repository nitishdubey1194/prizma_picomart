import { z } from "zod";

const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Expected HH:MM or HH:MM:SS");

export const createAvailabilityBlockSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: timeString,
  endTime: timeString,
});

export const updateAvailabilityBlockSchema = createAvailabilityBlockSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createExceptionSchema = z.object({
  exceptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  isAvailable: z.boolean(),
  startTime: timeString.optional(),
  endTime: timeString.optional(),
  reason: z.string().max(255).optional(),
});