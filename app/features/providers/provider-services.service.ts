import { PoolClient } from "pg";
import { AppError } from "@/lib/errors";
import { ProviderService } from "./provider-services.types";

function mapRow(row: { id:string; provider_id:string; service_id:string; name:string, price_override: string | null, duration_override_minutes: number, is_active: boolean, price: string, duration_minutes: number }): ProviderService {
  return {
    id: Number(row.id),
    providerId: Number(row.provider_id),
    serviceId: Number(row.service_id),
    serviceName: row.name,
    priceOverride: row.price_override !== null ? Number(row.price_override) : null,
    durationOverrideMinutes: row.duration_override_minutes,
    effectivePrice: Number(row.price_override ?? row.price),
    effectiveDurationMinutes: row.duration_override_minutes ?? row.duration_minutes,
    isActive: row.is_active,
  };
}

export async function listProviderServices(client: PoolClient, providerId: number): Promise<ProviderService[]> {
  const result = await client.query(
    `select ps.*, s.name, s.price, s.duration_minutes
     from provider_services ps
     join services s on s.id = ps.service_id
     where ps.provider_id = $1
     order by s.name`,
    [providerId]
  );
  return result.rows.map(mapRow);
}

export async function linkService(
  client: PoolClient,
  tenantId: number,
  providerId: number,
  data: { serviceId: number; priceOverride?: number; durationOverrideMinutes?: number }
): Promise<ProviderService> {
  const existing = await client.query(
    "select id from provider_services where provider_id = $1 and service_id = $2",
    [providerId, data.serviceId]
  );
  if (existing.rowCount) {
    throw new AppError(409, "This service is already linked to this provider.");
  }

  const inserted = await client.query(
    `insert into provider_services (tenant_id, provider_id, service_id, price_override, duration_override_minutes)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [tenantId, providerId, data.serviceId, data.priceOverride ?? null, data.durationOverrideMinutes ?? null]
  );

  const joined = await client.query(
    `select ps.*, s.name, s.price, s.duration_minutes
     from provider_services ps join services s on s.id = ps.service_id
     where ps.id = $1`,
    [inserted.rows[0].id]
  );
  return mapRow(joined.rows[0]);
}

export async function unlinkService(client: PoolClient, providerId: number, serviceId: number): Promise<boolean> {
  const result = await client.query(
    "delete from provider_services where provider_id = $1 and service_id = $2",
    [providerId, serviceId]
  );
  return (result.rowCount ?? 0) > 0;
}