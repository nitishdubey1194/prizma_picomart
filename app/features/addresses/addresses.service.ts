import { db } from "@/lib/db/index";
import { userAddresses } from "@/drizzle/schema";
import { withTenantContext } from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, desc, sql } from "drizzle-orm";

export interface CreateAddressInput {
  name?: string | null;
  phone?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  isDefault?: boolean;
  latitude?: string | null;
  longitude?: string | null;
}

export interface UpdateAddressInput {
  name?: string | null;
  phone?: string | null;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  isDefault?: boolean;
  latitude?: string | null;
  longitude?: string | null;
}

/**
 * Fetches all saved addresses for an authenticated user under the active tenant.
 */
export async function getUserAddresses(
  tenantId: number | bigint,
  userId: string
) {
  const pTenantId = Number(tenantId);

  return await db
    .select()
    .from(userAddresses)
    .where(
      and(
        eq(userAddresses.tenantId, pTenantId),
        eq(userAddresses.userId, userId)
      )
    )
    .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt));
}

/**
 * Creates a new address for the user. If marked as default, unsets default on existing addresses.
 */
export async function createUserAddress(
  tenantId: number | bigint,
  userId: string,
  input: CreateAddressInput
) {
  const pTenantId = Number(tenantId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    // If setting as default, clear existing default flag for this user
    if (input.isDefault) {
      await tx
        .update(userAddresses)
        .set({ isDefault: false, updatedAt: sql`now()` })
        .where(
          and(
            eq(userAddresses.tenantId, pTenantId),
            eq(userAddresses.userId, userId)
          )
        );
    }

    const [newAddress] = await tx
      .insert(userAddresses)
      .values({
        tenantId: pTenantId,
        userId,
        name: input.name ?? null,
        phone: input.phone ?? null,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 ?? null,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        country: input.country ?? "India",
        isDefault: input.isDefault ?? false,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      })
      .returning();

    return newAddress;
  });
}

/**
 * Updates an address record owned by the user.
 */
export async function updateUserAddress(
  tenantId: number | bigint,
  userId: string,
  addressId: number | bigint | string,
  input: UpdateAddressInput
) {
  const pTenantId = Number(tenantId);
  const pAddressIdBigInt = BigInt(addressId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    if (input.isDefault) {
      await tx
        .update(userAddresses)
        .set({ isDefault: false, updatedAt: sql`now()` })
        .where(
          and(
            eq(userAddresses.tenantId, pTenantId),
            eq(userAddresses.userId, userId)
          )
        );
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: sql`now()`,
    };

    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.phone !== undefined) updatePayload.phone = input.phone;
    if (input.addressLine1 !== undefined) updatePayload.addressLine1 = input.addressLine1;
    if (input.addressLine2 !== undefined) updatePayload.addressLine2 = input.addressLine2;
    if (input.city !== undefined) updatePayload.city = input.city;
    if (input.state !== undefined) updatePayload.state = input.state;
    if (input.pincode !== undefined) updatePayload.pincode = input.pincode;
    if (input.country !== undefined) updatePayload.country = input.country;
    if (input.isDefault !== undefined) updatePayload.isDefault = input.isDefault;
    if (input.latitude !== undefined) updatePayload.latitude = input.latitude;
    if (input.longitude !== undefined) updatePayload.longitude = input.longitude;

    const [updated] = await tx
      .update(userAddresses)
      .set(updatePayload)
      .where(
        and(
          eq(userAddresses.id, Number(pAddressIdBigInt)),
          eq(userAddresses.tenantId, pTenantId),
          eq(userAddresses.userId, userId)
        )
      )
      .returning();

    if (!updated) {
      throw new AppError(404, "Address not found.");
    }

    return updated;
  });
}

/**
 * Deletes an address record owned by the user.
 */
export async function deleteUserAddress(
  tenantId: number | bigint,
  userId: string,
  addressId: number | bigint | string
) {
  const pTenantId = Number(tenantId);
  const pAddressIdBigInt = BigInt(addressId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const deleted = await tx
      .delete(userAddresses)
      .where(
        and(
          eq(userAddresses.id, Number(pAddressIdBigInt)),
          eq(userAddresses.tenantId, pTenantId),
          eq(userAddresses.userId, userId)
        )
      )
      .returning();

    if (!deleted.length) {
      throw new AppError(404, "Address not found.");
    }

    return { success: true };
  });
}