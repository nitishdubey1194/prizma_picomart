import { PoolClient } from "pg";
import { Appointment } from "./appointments.types";

export type AppointmentWithDetails = Appointment & {
  providerName: string;
  serviceName: string;
  customerEmail: string;
};
function mapRowWithDetails(row: Parameters<typeof mapRow>[0] & {
  provider_name: string;
  service_name: string;
  customer_email: string;
}): AppointmentWithDetails {
  return {
    ...mapRow(row),
    providerName: row.provider_name,
    serviceName: row.service_name,
    customerEmail: row.customer_email,
  };
}
export async function listAppointmentsWithDetails(client: PoolClient): Promise<AppointmentWithDetails[]> {
  const result = await client.query(`
    select a.*, p.name as provider_name, s.name as service_name, u.email as customer_email
    from appointments a
    join providers p on p.id = a.provider_id
    join services s on s.id = a.service_id
    join users u on u.id = a.user_id
    order by a.start_time desc
  `);
  return result.rows.map(mapRowWithDetails);
}
function mapRow(row: { id: string; tenant_id: string; provider_id: string; service_id: string, user_id: string; start_time: string; end_time: string; status: "cancelled" | "confirmed" | "completed" | "pending"; price: string; customer_notes: string | null; internal_notes: string | null; cancelled_at: string | null; cancellation_reason: string | null; local_date: string; created_at: string; updated_at: string }): Appointment {
  return {
    id: Number(row.id),
    tenantId: Number(row.tenant_id),
    providerId: Number(row.provider_id),
    serviceId: Number(row.service_id),
    userId: row.user_id,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    price: Number(row.price),
    customerNotes: row.customer_notes,
    internalNotes: row.internal_notes,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason,
    localDate: row.local_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function bookAppointment(
  client: PoolClient,
  tenantId: number,
  data: { providerId: number; serviceId: number; startTime: string; customerNotes?: string }
) {
  const result = await client.query(
    "select * from book_appointment($1, $2, $3, $4, $5)",
    [tenantId, data.providerId, data.serviceId, data.startTime, data.customerNotes ?? null]
  );
  const row = result.rows[0];
  return {
    id: Number(row.appointment_id),
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    price: Number(row.price),
  };
}

export async function cancelAppointment(client: PoolClient, appointmentId: number, reason?: string) {
  await client.query("select cancel_appointment($1, $2)", [appointmentId, reason ?? null]);
}

export async function listAppointments(client: PoolClient): Promise<Appointment[]> {
  const result = await client.query("select * from appointments order by start_time desc");
  return result.rows.map(mapRow);
}

export async function getAppointmentById(client: PoolClient, id: number): Promise<Appointment | null> {
  const result = await client.query("select * from appointments where id = $1", [id]);
  return result.rowCount ? mapRow(result.rows[0]) : null;
}

export async function updateAppointmentStatus(
  client: PoolClient,
  id: number,
  status: "confirmed" | "completed" | "cancelled",
  changedBy: string
): Promise<Appointment | null> {
  const result = await client.query(
    `update appointments
     set status = $1, updated_at = now()
     where id = $2
       and (public.has_permission('booking.manage') or public.is_current_user_provider_for(provider_id))
     returning *`,
    [status, id]
  );
  console.log(result,'sfddsf');
  if (!result.rowCount) return null;

  const appt = result.rows[0];
  await client.query(
    `insert into appointment_status_logs (tenant_id, appointment_id, status, remarks, changed_by)
     values ($1, $2, $3, $4, $5)`,
    [appt.tenant_id, id, status, `Marked as ${status}`, changedBy]
  );

  return mapRow(appt);
}