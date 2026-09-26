import { PoolClient } from "pg";
import { Address } from "./addresses.types";

function mapRow(row: { id: string; name: string | null; phone: string | null; address_line1: string; address_line2: string | null; city: string; state: string; pincode: string; country: string; is_default: boolean, latitude: number | null; longitude: number | null }): Address {
  return {
    id: Number(row.id),
    name: row.name,
    phone: row.phone,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    country: row.country,
    isDefault: row.is_default,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
  };
}

export async function listAddresses(client: PoolClient, userId: string): Promise<Address[]> {
  const result = await client.query(
    "select * from user_addresses where user_id = $1 order by is_default desc, created_at desc",
    [userId]
  );
  return result.rows.map(mapRow);
}

export async function createAddress(
  client: PoolClient,
  tenantId: number,
  userId: string,
  data: { name?: string; phone?: string; addressLine1: string; addressLine2?: string; city: string; state: string; pincode: string; isDefault?: boolean, latitude?: number; longitude?: number }
): Promise<Address> {
  const result = await client.query(
    `insert into user_addresses (tenant_id, user_id, name, phone, address_line1, address_line2, city, state, pincode, is_default, latitude, longitude)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     returning *`,
    [tenantId, userId, data.name ?? null, data.phone ?? null, data.addressLine1, data.addressLine2 ?? null, data.city, data.state, data.pincode, data.isDefault ?? false, data.latitude ?? null, data.longitude ?? null]
  );
  return mapRow(result.rows[0]);
}

export async function deleteAddress(client: PoolClient, id: number): Promise<boolean> {
  const result = await client.query("delete from user_addresses where id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}