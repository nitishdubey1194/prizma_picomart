import { PoolClient } from "pg";
import { AvailabilityBlock, AvailabilityException } from "./availability.types";
import { generateSlots } from "./generate-slots";

function mapBlock(row: {id: string; tenant_id: string; provider_id: string; weekday: number; start_time: string; end_time: string; is_active: boolean}): AvailabilityBlock {
  return {
    id: Number(row.id),
    tenantId: Number(row.tenant_id),
    providerId: Number(row.provider_id),
    weekday: row.weekday,
    startTime: row.start_time,
    endTime: row.end_time,
    isActive: row.is_active,
  };
}

function mapException(row: {id: string; tenant_id: string; provider_id: string; exception_date: string; is_available: boolean; start_time: string | null; end_time: string | null; reason: string | null}): AvailabilityException {
  return {
    id: Number(row.id),
    tenantId: Number(row.tenant_id),
    providerId: Number(row.provider_id),
    exceptionDate: row.exception_date,
    isAvailable: row.is_available,
    startTime: row.start_time,
    endTime: row.end_time,
    reason: row.reason,
  };
}

export async function listAvailabilityBlocks(client: PoolClient, providerId: number): Promise<AvailabilityBlock[]> {
  const result = await client.query(
    "select * from provider_availability where provider_id = $1 order by weekday, start_time",
    [providerId]
  );
  return result.rows.map(mapBlock);
}

export async function createAvailabilityBlock(
  client: PoolClient,
  tenantId: number,
  providerId: number,
  data: { weekday: number; startTime: string; endTime: string }
): Promise<AvailabilityBlock> {
  const result = await client.query(
    `insert into provider_availability (tenant_id, provider_id, weekday, start_time, end_time)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [tenantId, providerId, data.weekday, data.startTime, data.endTime]
  );
  return mapBlock(result.rows[0]);
}

export async function updateAvailabilityBlock(
  client: PoolClient,
  id: number,
  data: Partial<{ weekday: number; startTime: string; endTime: string; isActive: boolean }>
): Promise<AvailabilityBlock | null> {
  const columnMap: Record<string, string> = {
    weekday: "weekday",
    startTime: "start_time",
    endTime: "end_time",
    isActive: "is_active",
  };

  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const [key, column] of Object.entries(columnMap)) {
    if (key in data) {
      fields.push(`${column} = $${i}`);
      values.push((data as { [key: string]: unknown })[key]);
      i++;
    }
  }

  if (fields.length === 0) {
    const existing = await client.query("select * from provider_availability where id = $1", [id]);
    return existing.rowCount ? mapBlock(existing.rows[0]) : null;
  }

  values.push(id);
  const result = await client.query(
    `update provider_availability set ${fields.join(", ")} where id = $${i} returning *`,
    values
  );
  return result.rowCount ? mapBlock(result.rows[0]) : null;
}

export async function deleteAvailabilityBlock(client: PoolClient, id: number): Promise<boolean> {
  const result = await client.query("delete from provider_availability where id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function listExceptions(client: PoolClient, providerId: number): Promise<AvailabilityException[]> {
  const result = await client.query(
    "select * from provider_availability_exceptions where provider_id = $1 order by exception_date",
    [providerId]
  );
  return result.rows.map(mapException);
}

export async function createException(
  client: PoolClient,
  tenantId: number,
  providerId: number,
  data: { exceptionDate: string; isAvailable: boolean; startTime?: string; endTime?: string; reason?: string }
): Promise<AvailabilityException> {
  const result = await client.query(
    `insert into provider_availability_exceptions (tenant_id, provider_id, exception_date, is_available, start_time, end_time, reason)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [tenantId, providerId, data.exceptionDate, data.isAvailable, data.startTime ?? null, data.endTime ?? null, data.reason ?? null]
  );
  return mapException(result.rows[0]);
}

export async function deleteException(client: PoolClient, id: number): Promise<boolean> {
  const result = await client.query("delete from provider_availability_exceptions where id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getProviderBusyWindows(
  client: PoolClient,
  providerId: number,
  date: string
): Promise<{ startTime: string; endTime: string }[]> {
  const result = await client.query(
    "select * from get_provider_busy_windows($1, $2::date)",
    [providerId, date]
  );
  return result.rows.map((r) => ({ startTime: r.start_time, endTime: r.end_time }));
}

export async function getAvailableSlots(
  client: PoolClient,
  providerId: number,
  date: string,
  durationMinutes: number
) {
  const [blocks, exceptions, busyWindows] = await Promise.all([
    listAvailabilityBlocks(client, providerId),
    listExceptions(client, providerId),
    getProviderBusyWindows(client, providerId, date),
  ]);

  return generateSlots({
    date,
    weeklyHours: blocks.filter((b) => b.isActive),
    exceptions: exceptions.map((e) => ({
      exceptionDate: e.exceptionDate,
      isAvailable: e.isAvailable,
      startTime: e.startTime,
      endTime: e.endTime,
    })),
    existingAppointments: busyWindows,
    durationMinutes,
  });
}