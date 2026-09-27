import { db } from "@/lib/db";
import {
  appointments,
  appointmentStatusLogs,
  providers,
  services,
  providerServices,
  users,
  profiles,
  userRoles
} from "@/drizzle/schema";
import { withTenantContext } from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, desc, sql, gte, lte, ne } from "drizzle-orm";

export type BookingStatusType = "pending" | "confirmed" | "cancelled" | "completed";



export interface AppointmentWithDetails {
  id: string;
  tenantId: number;
  providerId: number;
  serviceId: number;
  userId: string;
  startTime: string;
  endTime: string;
  localDate: string;
  status: string;
  price: string;
  customerNotes: string | null;
  internalNotes: string | null;
  createdAt: string;
  providerName: string;
  serviceName: string;
  customerName: string | null;
  customerEmail: string;
}
export interface CreateAppointmentInput {
  providerId: number | bigint | string;
  serviceId: number | bigint | string;
  startTime: string; // ISO 8601 string
  endTime: string;   // ISO 8601 string
  localDate: string; // YYYY-MM-DD
  customerNotes?: string | null;
}

export interface ProviderAppointmentFilterOptions {
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface ProviderAppointmentRecord {
  id: string;
  tenantId: number;
  providerId: number;
  serviceId: number;
  userId: string;
  customerName: string | null;
  customerEmail: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  localDate: string;
  status: string;
  price: string;
  customerNotes: string | null;
  internalNotes: string | null;
  createdAt: string;
}

export interface UpdateAppointmentStatusInput {
  status: BookingStatusType;
  remarks?: string | null;
}

export interface AppointmentFilterOptions {
  providerId?: number | bigint | string;
  status?: BookingStatusType;
  startDate?: string;
  endDate?: string;
}

/**
 * Lists appointments for an authenticated customer or staff member.
 */
export async function getAppointments(
  tenantId: number | bigint,
  userId: string,
  options: AppointmentFilterOptions = {}
): Promise<AppointmentWithDetails[]> {
  const pTenantId = Number(tenantId);

  return await withTenantContext(pTenantId, userId, async (tx): Promise<AppointmentWithDetails[]> => {
    // 1. Fetch user roles from user_roles
    const roleRows = await tx
      .select({ role: sql<string>`${userRoles.role}::text` })
      .from(userRoles)
      .where(sql`${userRoles.userId} = ${userId}::uuid`);

    const isVendor = roleRows.some((r) => r.role === "vendor");

    // 2. Fetch linked provider record for this tenant
    const [providerProfile] = await tx
      .select({ id: providers.id })
      .from(providers)
      .where(
        and(
          sql`${providers.userId} = ${userId}::uuid`,
          eq(providers.tenantId, pTenantId)
        )
      )
      .limit(1);

    // 3. Build conditions scoped to tenant
    const conditions = [eq(appointments.tenantId, pTenantId)];

    if (isVendor) {
      // Vendor: Sees all appointments. Only filter provider if requested in options
      if (options.providerId) {
        conditions.push(eq(appointments.providerId, Number(options.providerId)));
      }
    } else if (providerProfile) {
      // Provider: Constrained to their assigned provider ID
      conditions.push(eq(appointments.providerId, Number(providerProfile.id)));
    } else {
      // Customer: Constrained to appointments they created
      conditions.push(sql`${appointments.userId} = ${userId}::uuid`);
    }

    if (options.status) {
      conditions.push(sql`${appointments.status} = ${options.status}::booking_status`);
    }

    if (options.startDate) {
      conditions.push(gte(appointments.localDate, options.startDate));
    }

    if (options.endDate) {
      conditions.push(lte(appointments.localDate, options.endDate));
    }

    const rows = await tx
      .select({
        id: appointments.id,
        tenantId: appointments.tenantId,
        providerId: appointments.providerId,
        serviceId: appointments.serviceId,
        userId: appointments.userId,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        localDate: appointments.localDate,
        status: appointments.status,
        price: appointments.price,
        customerNotes: appointments.customerNotes,
        internalNotes: appointments.internalNotes,
        createdAt: appointments.createdAt,
        providerName: providers.name,
        serviceName: services.name,
        customerName: profiles.fullName,
        customerEmail: sql<string>`${users.email}::text`,
      })
      .from(appointments)
      .innerJoin(providers, eq(providers.id, appointments.providerId))
      .innerJoin(services, eq(services.id, appointments.serviceId))
      .innerJoin(users, eq(users.id, appointments.userId))
      .leftJoin(profiles, eq(profiles.id, appointments.userId))
      .where(and(...conditions))
      .orderBy(desc(appointments.startTime));

    return rows.map((row) => ({
      ...row,
      id: row.id.toString(),
      price: String(row.price),
    }));
  });
}

/**
 * Fetches appointment details with linked logs.
 */
export async function getAppointmentById(
  tenantId: number | bigint,
  userId: string,
  appointmentId: number | bigint | string
) {
  const pTenantId = Number(tenantId);
  const pAppointmentId = Number(appointmentId);

  const [appointment] = await db
    .select({
      id: appointments.id,
      tenantId: appointments.tenantId,
      providerId: appointments.providerId,
      serviceId: appointments.serviceId,
      userId: appointments.userId,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      localDate: appointments.localDate,
      status: appointments.status,
      price: appointments.price,
      customerNotes: appointments.customerNotes,
      internalNotes: appointments.internalNotes,
      cancelledAt: appointments.cancelledAt,
      cancellationReason: appointments.cancellationReason,
      createdAt: appointments.createdAt,
      providerName: providers.name,
      serviceName: services.name,
    })
    .from(appointments)
    .innerJoin(providers, eq(providers.id, appointments.providerId))
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .where(
      and(
        eq(appointments.id, pAppointmentId),
        eq(appointments.tenantId, pTenantId),
        eq(appointments.userId, userId)
      )
    )
    .limit(1);

  if (!appointment) {
    return null;
  }

  const logs = await db
    .select({
      id: appointmentStatusLogs.id,
      status: appointmentStatusLogs.status,
      remarks: appointmentStatusLogs.remarks,
      createdAt: appointmentStatusLogs.createdAt,
    })
    .from(appointmentStatusLogs)
    .where(
      and(
        eq(appointmentStatusLogs.appointmentId, pAppointmentId),
        eq(appointmentStatusLogs.tenantId, pTenantId)
      )
    )
    .orderBy(desc(appointmentStatusLogs.createdAt));

  return {
    ...appointment,
    logs,
  };
}

/**
 * Creates an appointment booking after verifying provider service association, pricing, and overlap.
 */
export async function createAppointment(
  tenantId: number | bigint,
  userId: string,
  input: CreateAppointmentInput
) {
  const pTenantId = Number(tenantId);
  const pProviderId = Number(input.providerId);
  const pServiceId = Number(input.serviceId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    // 1. Validate provider and service active status under this tenant
    const [provider] = await tx
      .select({ id: providers.id })
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
      throw new AppError(404, "Provider not found or currently inactive.");
    }

    // 2. Fetch base service and provider override price[cite: 1]
    const [serviceMapping] = await tx
      .select({
        serviceId: services.id,
        basePrice: services.price,
        overridePrice: providerServices.priceOverride,
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

    if (!serviceMapping) {
      throw new AppError(404, "Service not found or unavailable.");
    }
    const effectivePrice =
      serviceMapping.overridePrice != null
        ? String(serviceMapping.overridePrice)
        : String(serviceMapping.basePrice);

    // 3. Check for overlapping active appointments for this provider[cite: 1]
    const check = await tx.execute(
  sql`SELECT current_setting('app.current_user_id', true) AS current_user, auth.uid() AS auth_uid`
);
console.log("DB AUTH CHECK:", check);
    const [overlapping] = await tx
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, pTenantId),
          eq(appointments.providerId, pProviderId),
          sql`${appointments.status} <> 'cancelled'::booking_status`,
          sql`${appointments.startTime} < ${input.endTime}::timestamptz AND ${appointments.endTime} > ${input.startTime}::timestamptz`
        )
      )
      .limit(1);

    if (overlapping) {
      throw new AppError(409, "The selected time slot is no longer available.");
    }
    // 4. Insert appointment record[cite: 1]
    const [newAppointment] = await tx
      .insert(appointments)
      .values({
        tenantId: pTenantId,
        providerId: pProviderId,
        serviceId: pServiceId,
        userId,
        startTime: input.startTime,
        endTime: input.endTime,
        localDate: input.localDate,
        status: sql`'pending'::booking_status`,
        price: effectivePrice,
        customerNotes: input.customerNotes ?? null,
      })
      .returning();
    // 5. Append initial creation entry to status audit log[cite: 1]
    await tx.insert(appointmentStatusLogs).values({
      tenantId: pTenantId,
      appointmentId: newAppointment.id,
      status: sql`'pending'::booking_status`,
      remarks: "Appointment booked by client.",
      changedBy: userId,
    });

    return newAppointment;
  });
}
/**
 * Updates the status of an appointment (e.g. confirmed, completed) and logs changes.
 */
export async function updateAppointmentStatus(
  tenantId: number | bigint,
  userId: string,
  appointmentId: number | bigint | string,
  input: UpdateAppointmentStatusInput
) {
  const pTenantId = Number(tenantId);
  const pAppointmentId = Number(appointmentId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const [existing] = await tx
      .select({ id: appointments.id, status: appointments.status })
      .from(appointments)
      .where(
        and(
          eq(appointments.id, pAppointmentId),
          eq(appointments.tenantId, pTenantId)
        )
      )
      .limit(1);

    if (!existing) {
      throw new AppError(404, "Appointment not found.");
    }

    if (existing.status === input.status) {
      return { success: true, message: "Appointment already in this status." };
    }

    const updatePayload: Record<string, unknown> = {
      status: input.status,
      updatedAt: sql`now()`,
    };

    if (input.status === "cancelled") {
      updatePayload.cancelledAt = sql`now()`;
      updatePayload.cancellationReason = input.remarks ?? "Cancelled by user";
    }

    const [updated] = await tx
      .update(appointments)
      .set(updatePayload)
      .where(
        and(
          eq(appointments.id, pAppointmentId),
          eq(appointments.tenantId, pTenantId)
        )
      )
      .returning();

    // Append to status logs[cite: 1]
    await tx.insert(appointmentStatusLogs).values({
      tenantId: pTenantId,
      appointmentId: pAppointmentId,
      status: input.status,
      remarks: input.remarks ?? `Status updated to ${input.status}.`,
      changedBy: userId,
    });

    return updated;
  });
}

/**
 * Cancels an appointment.
 */
export async function cancelAppointment(
  tenantId: number | bigint,
  userId: string,
  appointmentId: number | bigint | string,
  reason?: string | null
) {
  return await updateAppointmentStatus(tenantId, userId, appointmentId, {
    status: "cancelled",
    remarks: reason ?? "Cancelled by user.",
  });
}

