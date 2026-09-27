import { db } from "@/lib/db";
import {
  providerAvailability,
  providerAvailabilityExceptions,
  appointments,
  services,
  providerServices,
} from "@/drizzle/schema";
import { AppError } from "@/lib/errors";
import { and, eq, ne, sql } from "drizzle-orm";

export interface SlotTime {
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  formattedTime: string; // e.g. "09:00 - 09:30"
}

export interface GenerateSlotsOptions {
  tenantId: number | bigint;
  providerId: number | bigint;
  serviceId: number | bigint;
  date: string; // YYYY-MM-DD
}

/**
 * Generates open appointment slots for a given provider, service, and date.
 */
export async function generateAvailableSlots(
  options: GenerateSlotsOptions
): Promise<SlotTime[]> {
  const pTenantId = Number(options.tenantId);
  const pProviderId = Number(options.providerId);
  const pServiceId = Number(options.serviceId);
  const targetDateStr = options.date;

  // 1. Fetch service requirements (duration and buffer minutes)[cite: 1]
  const [service] = await db
    .select({
      id: services.id,
      durationMinutes: services.durationMinutes,
      bufferMinutes: services.bufferMinutes,
      overrideDuration: providerServices.durationOverrideMinutes,
      isMappingActive: providerServices.isActive,
    })
    .from(services)
    .leftJoin(
      providerServices,
      and(
        eq(providerServices.serviceId, services.id),
        eq(providerServices.providerId, pProviderId),
        eq(providerServices.tenantId, pTenantId)
      )
    )
    .where(
      and(
        eq(services.id, pServiceId),
        eq(services.tenantId, pTenantId),
        eq(services.isActive, true)
      )
    )
    .limit(1);

  if (!service) {
    throw new AppError(404, "Service not found or unavailable.");
  }

  const effectiveDuration = service.overrideDuration ?? service.durationMinutes;
  const totalSlotSpanMs = (effectiveDuration + service.bufferMinutes) * 60 * 1000;
  const serviceDurationMs = effectiveDuration * 60 * 1000;

  // 2. Check for date exceptions (blackout vs special working hours)[cite: 1]
  const [exception] = await db
    .select()
    .from(providerAvailabilityExceptions)
    .where(
      and(
        eq(providerAvailabilityExceptions.tenantId, pTenantId),
        eq(providerAvailabilityExceptions.providerId, pProviderId),
        eq(providerAvailabilityExceptions.exceptionDate, targetDateStr)
      )
    )
    .limit(1);

  // If a blackout date exception exists (isAvailable = false), return no slots[cite: 1]
  if (exception && !exception.isAvailable) {
    return [];
  }

  // 3. Determine operational time windows for the target date[cite: 1]
  interface TimeWindow {
    startMs: number;
    endMs: number;
  }
  const operationalWindows: TimeWindow[] = [];

  if (exception && exception.isAvailable && exception.startTime && exception.endTime) {
    const windowStart = new Date(`${targetDateStr}T${exception.startTime}`).getTime();
    const windowEnd = new Date(`${targetDateStr}T${exception.endTime}`).getTime();
    operationalWindows.push({ startMs: windowStart, endMs: windowEnd });
  } else {
    // Fall back to recurring weekday schedule[cite: 1]
    const weekday = new Date(`${targetDateStr}T00:00:00`).getDay(); // 0 (Sun) to 6 (Sat)

    const scheduleBlocks = await db
      .select({
        startTime: providerAvailability.startTime,
        endTime: providerAvailability.endTime,
      })
      .from(providerAvailability)
      .where(
        and(
          eq(providerAvailability.tenantId, pTenantId),
          eq(providerAvailability.providerId, pProviderId),
          eq(providerAvailability.weekday, weekday),
          eq(providerAvailability.isActive, true)
        )
      );

    for (const block of scheduleBlocks) {
      const windowStart = new Date(`${targetDateStr}T${block.startTime}`).getTime();
      const windowEnd = new Date(`${targetDateStr}T${block.endTime}`).getTime();
      operationalWindows.push({ startMs: windowStart, endMs: windowEnd });
    }
  }

  if (operationalWindows.length === 0) {
    return [];
  }

  // 4. Fetch all existing active appointments on this date[cite: 1]
  const bookedAppointments = await db
    .select({
      startTime: appointments.startTime,
      endTime: appointments.endTime,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.tenantId, pTenantId),
        eq(appointments.providerId, pProviderId),
        eq(appointments.localDate, targetDateStr),
        ne(appointments.status, "cancelled")
      )
    );

  const bookedRanges = bookedAppointments.map((b) => ({
    startMs: new Date(b.startTime).getTime(),
    endMs: new Date(b.endTime).getTime(),
  }));

  // 5. Generate discrete time intervals and filter out conflicts[cite: 1]
  const availableSlots: SlotTime[] = [];
  const nowMs = Date.now();

  for (const window of operationalWindows) {
    let currentSlotStartMs = window.startMs;

    while (currentSlotStartMs + serviceDurationMs <= window.endMs) {
      const currentSlotEndMs = currentSlotStartMs + serviceDurationMs;

      // Ensure slot is not in the past
      if (currentSlotStartMs > nowMs) {
        // Check for collision with any booked appointment
        const hasOverlap = bookedRanges.some(
          (booked) =>
            currentSlotStartMs < booked.endMs && currentSlotEndMs > booked.startMs
        );

        if (!hasOverlap) {
          const startDate = new Date(currentSlotStartMs);
          const endDate = new Date(currentSlotEndMs);

          const formatTimeStr = (d: Date) =>
            d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

          availableSlots.push({
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
            formattedTime: `${formatTimeStr(startDate)} - ${formatTimeStr(endDate)}`,
          });
        }
      }

      currentSlotStartMs += totalSlotSpanMs;
    }
  }

  return availableSlots;
}