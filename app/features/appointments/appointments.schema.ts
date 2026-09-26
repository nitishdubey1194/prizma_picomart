import { z } from "zod";

export const createAppointmentSchema = z.object({
  providerId: z.number().int().positive(),
  serviceId: z.number().int().positive(),
  startTime: z.string().datetime({ offset: true }),
  customerNotes: z.string().optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().max(255).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["confirmed", "completed", "cancelled"]),
});