import { db } from "@/lib/db/index";
import {
  providers,
  providerServices,
  services,
  users,
  providerAvailability,
  providerAvailabilityExceptions,
} from "@/drizzle/schema";
import {
  assertTenantRecordExists,
  assertUniqueTenantSlug,
  withTenantContext,
} from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, sql, asc, inArray, gte, lte } from "drizzle-orm";

export interface TodaySchedule {
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
  formatted?: string;
  isExceptionOverride?: boolean;
}

export interface DayScheduleSlot {
  date: string;
  dayName: string;
  isAvailable: boolean;
  startTime?: string | null;
  endTime?: string | null;
  formatted?: string;
}

export interface ProviderListItem {
  id: number;
  name: string;
  avatarUrl?: string | null;
  isActive: boolean | null;
}

export interface CreateProviderInput {
  name: string;
  slug: string;
  category: string;
  title?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  userId?: string | null;
  isActive?: boolean;
  latitude?: string | null;
  longitude?: string | null;
}

export interface UpdateProviderInput {
  name?: string;
  slug?: string;
  category?: string;
  title?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
}

export interface LinkUserToProviderInput {
  userId: string;
}

function formatTime(timeStr: string | null | undefined): string | null {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;

  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;

  return `${displayHours}:${minutes} ${period}`;
}

/**
 * Computes 7-day upcoming schedules for a batch of provider IDs using
 * providerAvailability (recurring weekly) and providerAvailabilityExceptions (specific date overrides).
 */
export async function getUpcomingSchedulesForProviders(
  providerIds: number[],
  daysCount = 7
): Promise<Map<number, DayScheduleSlot[]>> {
  const scheduleMap = new Map<number, DayScheduleSlot[]>();
  if (providerIds.length === 0) return scheduleMap;

  // Build target dates array [today, today+1, ..., today+6]
  const targetDates: { dateObj: Date; dateStr: string; weekday: number }[] = [];
  for (let i = 0; i < daysCount; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
    targetDates.push({
      dateObj: d,
      dateStr,
      weekday: d.getDay(), // 0 = Sunday ... 6 = Saturday
    });
  }

  const startDateStr = targetDates[0].dateStr;
  const endDateStr = targetDates[targetDates.length - 1].dateStr;

  // 1. Fetch recurring availability using `weekday`
  const recurringRows = await db
    .select({
      providerId: providerAvailability.providerId,
      weekday: providerAvailability.weekday,
      startTime: providerAvailability.startTime,
      endTime: providerAvailability.endTime,
      isActive: providerAvailability.isActive,
    })
    .from(providerAvailability)
    .where(
      and(
        inArray(providerAvailability.providerId, providerIds),
        eq(providerAvailability.isActive, true)
      )
    );

  // 2. Fetch specific date exceptions using `exceptionDate`
  const exceptionRows = await db
    .select({
      providerId: providerAvailabilityExceptions.providerId,
      exceptionDate: sql<string>`TO_CHAR(${providerAvailabilityExceptions.exceptionDate}, 'YYYY-MM-DD')`.as("exception_date"),
      startTime: providerAvailabilityExceptions.startTime,
      endTime: providerAvailabilityExceptions.endTime,
      isAvailable: providerAvailabilityExceptions.isAvailable,
      reason: providerAvailabilityExceptions.reason,
    })
    .from(providerAvailabilityExceptions)
    .where(
      and(
        inArray(providerAvailabilityExceptions.providerId, providerIds),
        gte(providerAvailabilityExceptions.exceptionDate, sql`${startDateStr}::date`),
        lte(providerAvailabilityExceptions.exceptionDate, sql`${endDateStr}::date`)
      )
    );

  // Group recurring rows by providerId -> weekday
  const recurringByProvider = new Map<number, Map<number, (typeof recurringRows)[0]>>();
  for (const row of recurringRows) {
    if (!recurringByProvider.has(row.providerId)) {
      recurringByProvider.set(row.providerId, new Map());
    }
    recurringByProvider.get(row.providerId)!.set(row.weekday, row);
  }

  // Group exceptions by providerId -> exceptionDate (YYYY-MM-DD)
  const exceptionsByProvider = new Map<number, Map<string, (typeof exceptionRows)[0]>>();
  for (const row of exceptionRows) {
    if (!exceptionsByProvider.has(row.providerId)) {
      exceptionsByProvider.set(row.providerId, new Map());
    }
    exceptionsByProvider.get(row.providerId)!.set(row.exceptionDate, row);
  }

  // Generate 7-day schedule for each provider
  for (const providerId of providerIds) {
    const providerRecurring = recurringByProvider.get(providerId);
    const providerExceptions = exceptionsByProvider.get(providerId);

    const slots: DayScheduleSlot[] = targetDates.map(({ dateObj, dateStr, weekday }) => {
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
      const displayDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const exception = providerExceptions?.get(dateStr);
      const recurring = providerRecurring?.get(weekday);

      // Exception overrides recurring rule
      if (exception) {
        const isAvailable = Boolean(exception.isAvailable);
        const startTime = isAvailable ? (exception.startTime ?? recurring?.startTime ?? null) : null;
        const endTime = isAvailable ? (exception.endTime ?? recurring?.endTime ?? null) : null;

        const startFormatted = formatTime(startTime);
        const endFormatted = formatTime(endTime);

        return {
          date: displayDate,
          dayName,
          isAvailable,
          startTime,
          endTime,
          formatted:
            isAvailable && startFormatted && endFormatted
              ? `${startFormatted} - ${endFormatted}`
              : "Unavailable",
        };
      }

      // Default recurring availability rule
      if (recurring && recurring.isActive) {
        const startFormatted = formatTime(recurring.startTime);
        const endFormatted = formatTime(recurring.endTime);

        return {
          date: displayDate,
          dayName,
          isAvailable: true,
          startTime: recurring.startTime,
          endTime: recurring.endTime,
          formatted:
            startFormatted && endFormatted
              ? `${startFormatted} - ${endFormatted}`
              : "Available",
        };
      }

      return {
        date: displayDate,
        dayName,
        isAvailable: false,
        startTime: null,
        endTime: null,
        formatted: "Off",
      };
    });

    scheduleMap.set(providerId, slots);
  }

  return scheduleMap;
}

/**
 * Fetches the next 7 days of upcoming availability for a single provider.
 */
export async function getProviderUpcomingSchedule(
  providerId: number | bigint | string,
  daysCount = 7
): Promise<DayScheduleSlot[]> {
  const id = Number(providerId);
  const result = await getUpcomingSchedulesForProviders([id], daysCount);
  return result.get(id) || [];
}

export async function getProvidersByService(
  tenantId: number | bigint,
  serviceId?: number | bigint | null
): Promise<ProviderListItem[]> {
  const pTenantId = Number(tenantId);

  if (!serviceId) {
    const rows = await db
      .select({
        id: providers.id,
        name: providers.name,
        title: providers.title,
        avatarUrl: providers.avatarUrl,
        isActive: providers.isActive,
        userId: providers.userId,
      })
      .from(providers)
      .where(
        and(
          eq(providers.tenantId, pTenantId),
          eq(providers.isActive, true)
        )
      );

    return rows.map((r) => ({
      ...r,
      id: Number(r.id),
      isActive: r.isActive ?? false,
    }));
  }

  const pServiceId = Number(serviceId);

  const rows = await db
    .select({
      id: providers.id,
      name: providers.name,
      title: providers.title,
      avatarUrl: providers.avatarUrl,
      isActive: providers.isActive,
      basePrice: services.price,
      priceOverride: providerServices.priceOverride,
      baseDurationMinutes: services.durationMinutes,
      durationOverrideMinutes: providerServices.durationOverrideMinutes,
      effectivePrice: sql<string>`COALESCE(${providerServices.priceOverride}, ${services.price})`.as("effective_price"),
      effectiveDuration: sql<number>`COALESCE(${providerServices.durationOverrideMinutes}, ${services.durationMinutes})`.as("effective_duration"),
    })
    .from(providers)
    .innerJoin(
      providerServices,
      eq(providerServices.providerId, providers.id)
    )
    .innerJoin(
      services,
      eq(services.id, providerServices.serviceId)
    )
    .where(
      and(
        eq(providers.tenantId, pTenantId),
        eq(providerServices.serviceId, pServiceId),
        eq(providerServices.isActive, true),
        eq(providers.isActive, true)
      )
    );

  return rows.map((r) => ({
    ...r,
    id: Number(r.id),
    isActive: r.isActive ?? false,
  }));
}

/**
 * Lists all active providers for the tenant with their today's schedule and upcoming 7-day availability.
 */
export async function getTenantProviders(tenantId: number | bigint) {
  const pTenantId = Number(tenantId);

  const rows = await db
    .select({
      id: providers.id,
      tenantId: providers.tenantId,
      userId: providers.userId,
      name: providers.name,
      slug: providers.slug,
      category: providers.category,
      title: providers.title,
      bio: providers.bio,
      avatarUrl: providers.avatarUrl,
      isActive: providers.isActive,
      createdAt: providers.createdAt,
      updatedAt: providers.updatedAt,
      userLinkEmail: users.email,
      latitude: providers.latitude,
      longitude: providers.longitude,
      todayRecurringStartTime: providerAvailability.startTime,
      todayRecurringEndTime: providerAvailability.endTime,
      isRecurringActive: providerAvailability.isActive,
      isExceptionAvailable: providerAvailabilityExceptions.isAvailable,
      exceptionStartTime: providerAvailabilityExceptions.startTime,
      exceptionEndTime: providerAvailabilityExceptions.endTime,
      exceptionReason: providerAvailabilityExceptions.reason,
      isAvailableToday: sql<boolean>`
        CASE
          WHEN ${providerAvailabilityExceptions.id} IS NOT NULL THEN
            COALESCE(${providerAvailabilityExceptions.isAvailable}, false)
          WHEN ${providerAvailability.id} IS NOT NULL THEN
            COALESCE(${providerAvailability.isActive}, true)
          ELSE false
        END
      `.as("is_available_today"),
      todayStartTime: sql<string | null>`
        CASE
          WHEN ${providerAvailabilityExceptions.id} IS NOT NULL AND ${providerAvailabilityExceptions.isAvailable} = true THEN
            COALESCE(${providerAvailabilityExceptions.startTime}, ${providerAvailability.startTime})
          WHEN ${providerAvailabilityExceptions.id} IS NOT NULL AND ${providerAvailabilityExceptions.isAvailable} = false THEN
            NULL
          ELSE ${providerAvailability.startTime}
        END
      `.as("today_start_time"),
      todayEndTime: sql<string | null>`
        CASE
          WHEN ${providerAvailabilityExceptions.id} IS NOT NULL AND ${providerAvailabilityExceptions.isAvailable} = true THEN
            COALESCE(${providerAvailabilityExceptions.endTime}, ${providerAvailability.endTime})
          WHEN ${providerAvailabilityExceptions.id} IS NOT NULL AND ${providerAvailabilityExceptions.isAvailable} = false THEN
            NULL
          ELSE ${providerAvailability.endTime}
        END
      `.as("today_end_time"),
    })
    .from(providers)
    .leftJoin(users, eq(providers.userId, users.id))
    .leftJoin(
      providerAvailability,
      and(
        eq(providerAvailability.providerId, providers.id),
        eq(providerAvailability.weekday, sql`EXTRACT(DOW FROM CURRENT_DATE)::smallint`),
        eq(providerAvailability.isActive, true)
      )
    )
    .leftJoin(
      providerAvailabilityExceptions,
      and(
        eq(providerAvailabilityExceptions.providerId, providers.id),
        eq(providerAvailabilityExceptions.exceptionDate, sql`CURRENT_DATE`)
      )
    )
    .where(
      and(
        eq(providers.tenantId, pTenantId),
        eq(providers.isActive, true)
      )
    )
    .orderBy(asc(providers.name));

  const providerIds = rows.map((r) => Number(r.id));
  const schedulesMap = await getUpcomingSchedulesForProviders(providerIds, 7);

  return rows.map((row) => {
    const formattedStart = formatTime(row.todayStartTime);
    const formattedEnd = formatTime(row.todayEndTime);

    return {
      ...row,
      todaySchedule: {
        isAvailable: Boolean(row.isAvailableToday),
        startTime: row.todayStartTime,
        endTime: row.todayEndTime,
        formatted:
          row.isAvailableToday && formattedStart && formattedEnd
            ? `Available today: ${formattedStart} - ${formattedEnd}`
            : "Unavailable today",
        isExceptionOverride: row.isExceptionAvailable !== null,
      },
      upcomingSchedule: schedulesMap.get(Number(row.id)) ?? [],
    };
  });
}

/**
 * Fetches a single provider by ID along with their linked services and pricing overrides.
 */
export async function getProviderById(
  tenantId: number | bigint,
  providerId: number | bigint | string
) {
  const pTenantId = Number(tenantId);
  const pProviderId = Number(providerId);

  const [provider] = await db
    .select()
    .from(providers)
    .where(
      and(
        eq(providers.id, pProviderId),
        eq(providers.tenantId, pTenantId),
        eq(providers.isActive, true)
      )
    )
    .limit(1);

  if (!provider) {
    return null;
  }

  const [linkedServices, upcomingSchedule] = await Promise.all([
    db
      .select({
        providerServiceId: providerServices.id,
        serviceId: providerServices.serviceId,
        name: services.name,
        slug: services.slug,
        basePrice: services.price,
        priceOverride: providerServices.priceOverride,
        baseDurationMinutes: services.durationMinutes,
        durationOverrideMinutes: providerServices.durationOverrideMinutes,
        bufferMinutes: services.bufferMinutes,
        isActive: providerServices.isActive,
      })
      .from(providerServices)
      .innerJoin(services, eq(services.id, providerServices.serviceId))
      .where(
        and(
          eq(providerServices.tenantId, pTenantId),
          eq(providerServices.providerId, pProviderId),
          eq(providerServices.isActive, true)
        )
      ),
    getProviderUpcomingSchedule(pProviderId, 7),
  ]);

  return {
    ...provider,
    services: linkedServices,
    upcomingSchedule,
  };
}

/**
 * Creates a provider within the tenant context.
 */
export async function createProvider(
  tenantId: number | bigint,
  userId: string,
  input: CreateProviderInput
) {
  const pTenantId = Number(tenantId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    await assertUniqueTenantSlug(tx, providers, pTenantId, input.slug);

    if (input.userId) {
      await assertTenantRecordExists(
        tx,
        users,
        pTenantId,
        input.userId,
        "User account to link not found."
      );
    }

    const [newProvider] = await tx
      .insert(providers)
      .values({
        tenantId: pTenantId,
        userId: input.userId ?? null,
        name: input.name,
        slug: input.slug,
        category: input.category,
        title: input.title ?? null,
        bio: input.bio ?? null,
        avatarUrl: input.avatarUrl ?? null,
        isActive: input.isActive ?? true,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      })
      .returning();

    return newProvider;
  });
}

/**
 * Updates provider attributes.
 */
export async function updateProvider(
  tenantId: number | bigint,
  userId: string,
  providerId: number | bigint | string,
  input: UpdateProviderInput
) {
  const pTenantId = Number(tenantId);
  const pProviderId = Number(providerId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    if (input.slug) {
      await assertUniqueTenantSlug(
        tx,
        providers,
        pTenantId,
        input.slug,
        pProviderId
      );
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: sql`now()`,
    };

    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.slug !== undefined) updatePayload.slug = input.slug;
    if (input.category !== undefined) updatePayload.category = input.category;
    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.bio !== undefined) updatePayload.bio = input.bio;
    if (input.avatarUrl !== undefined) updatePayload.avatarUrl = input.avatarUrl;
    if (input.isActive !== undefined) updatePayload.isActive = input.isActive;

    const [updated] = await tx
      .update(providers)
      .set(updatePayload)
      .where(
        and(
          eq(providers.id, pProviderId),
          eq(providers.tenantId, pTenantId)
        )
      )
      .returning();

    if (!updated) {
      throw new AppError(404, "Provider not found.");
    }

    return updated;
  });
}

/**
 * Links a provider to an application user account.
 */
export async function linkUserToProvider(
  tenantId: number | bigint,
  adminUserId: string,
  providerId: number | bigint | string,
  input: LinkUserToProviderInput
) {
  const pTenantId = Number(tenantId);
  const pProviderId = Number(providerId);

  return await withTenantContext(pTenantId, adminUserId, async (tx) => {
    const [updated] = await tx
      .update(providers)
      .set({
        userId: input.userId,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(providers.id, pProviderId),
          eq(providers.tenantId, pTenantId)
        )
      )
      .returning();

    if (!updated) {
      throw new AppError(404, "Provider not found.");
    }

    return updated;
  });
}

/**
 * Soft deletes a provider.
 */
export async function deleteProvider(
  tenantId: number | bigint,
  userId: string,
  providerId: number | bigint | string
) {
  const pTenantId = Number(tenantId);
  const pProviderId = Number(providerId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const [deleted] = await tx
      .update(providers)
      .set({
        isActive: false,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(providers.id, pProviderId),
          eq(providers.tenantId, pTenantId)
        )
      )
      .returning({ id: providers.id });

    if (!deleted) {
      throw new AppError(404, "Provider not found.");
    }

    return { success: true };
  });
}

export async function getProvidersByCategory(
  tenantId: number | bigint,
  category: string
) {
  const pTenantId = Number(tenantId);

  return await db
    .select({
      id: providers.id,
      name: providers.name,
      slug: providers.slug,
      category: providers.category,
      title: providers.title,
      bio: providers.bio,
      avatarUrl: providers.avatarUrl,
    })
    .from(providers)
    .where(
      and(
        eq(providers.tenantId, pTenantId),
        eq(providers.category, category),
        eq(providers.isActive, true)
      )
    )
    .orderBy(asc(providers.name));
}

/**
 * Fetches a single provider by tenantId and slug, resolving services with overrides and upcoming schedule.
 */
export async function getProviderBySlug(
  tenantId: number | bigint,
  slug: string
) {
  const pTenantId = Number(tenantId);

  const [provider] = await db
    .select({
      id: providers.id,
      name: providers.name,
      slug: providers.slug,
      category: providers.category,
      title: providers.title,
      bio: providers.bio,
      avatarUrl: providers.avatarUrl,
    })
    .from(providers)
    .where(
      and(
        eq(providers.tenantId, pTenantId),
        eq(providers.slug, slug),
        eq(providers.isActive, true)
      )
    )
    .limit(1);

  if (!provider) return null;

  const [linkedServices, upcomingSchedule] = await Promise.all([
    db
      .select({
        id: services.id,
        name: services.name,
        slug: services.slug,
        description: services.description,
        basePrice: services.price,
        priceOverride: providerServices.priceOverride,
        baseDurationMinutes: services.durationMinutes,
        durationOverrideMinutes: providerServices.durationOverrideMinutes,
        effectivePrice: sql<string>`COALESCE(${providerServices.priceOverride}, ${services.price})`.as("effective_price"),
        effectiveDuration: sql<number>`COALESCE(${providerServices.durationOverrideMinutes}, ${services.durationMinutes})`.as("effective_duration"),
      })
      .from(providerServices)
      .innerJoin(services, eq(services.id, providerServices.serviceId))
      .where(
        and(
          eq(providerServices.tenantId, pTenantId),
          eq(providerServices.providerId, provider.id),
          eq(providerServices.isActive, true),
          eq(services.isActive, true)
        )
      ),
    getProviderUpcomingSchedule(provider.id, 7),
  ]);

  return {
    ...provider,
    services: linkedServices,
    upcomingSchedule,
  };
}