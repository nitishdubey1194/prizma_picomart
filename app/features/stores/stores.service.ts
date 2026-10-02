import { db } from "@/lib/db";
import { stores } from "@/drizzle/schema";
import { withTenantContext } from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, desc, sql } from "drizzle-orm";

export interface CreateStoreInput {
  name: string;
  addressLine1: string;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  deliveryMode?: "radius" | "pincode";
  deliveryRadiusKm?: string | number | null;
  handlingFee?: string | number | null;
  minOrderPrice?: number | null;
  deliveryFeeValueType?: "fixed" | "per_km";
  baseDistanceKm?: string | number;
  deliveryFeeBasePrice?: string | number | null;
  deliveryFeePerkm?: string | number;
  deliveryFeeFixed?: string | number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface UpdateStoreInput {
  name?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  deliveryMode?: "radius" | "pincode";
  deliveryRadiusKm?: string | number | null;
  handlingFee?: string | number | null;
  minOrderPrice?: number | null;
  deliveryFeeValueType?: "fixed" | "per_km";
  baseDistanceKm?: string | number;
  deliveryFeeBasePrice?: string | number | null;
  deliveryFeePerkm?: string | number;
  deliveryFeeFixed?: string | number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface StoreRecord {
  id: string;
  tenantId: number;
  name: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  latitude: string | null;
  longitude: string | null;
  deliveryMode: "radius" | "pincode" | null;
  deliveryRadiusKm: string | null;
  handlingFee: string | null;
  minOrderPrice: number | null;
  deliveryFeeValueType: "fixed" | "per_km";
  baseDistanceKm: string;
  deliveryFeeBasePrice: string | null;
  deliveryFeePerkm: string;
  deliveryFeeFixed: string;
  isDefault: boolean | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Lists all active store outlets for the tenant.
 */
export async function getTenantStores(
  tenantId: number | bigint
): Promise<StoreRecord[]> {
  const pTenantId = Number(tenantId);

  const rows = await db
    .select()
    .from(stores)
    .where(
      and(
        eq(stores.tenantId, pTenantId),
        eq(stores.isActive, true)
      )
    )
    .orderBy(desc(stores.isDefault), desc(stores.createdAt));

  return rows.map((store) => ({
    ...store,
    id: store.id.toString(),
  }));
}

/**
 * Fetches a single store by its ID.
 */
export async function getStoreById(
  tenantId: number | bigint,
  storeId: number | bigint | string
): Promise<StoreRecord | null> {
  const pTenantId = Number(tenantId);
  const pStoreIdBigInt = Number(storeId);

  const [store] = await db
    .select()
    .from(stores)
    .where(
      and(
        eq(stores.id, pStoreIdBigInt),
        eq(stores.tenantId, pTenantId),
        eq(stores.isActive, true)
      )
    )
    .limit(1);

  if (!store) {
    return null;
  }

  return {
    ...store,
    id: store.id.toString(),
  };
}

/**
 * Creates a store location. If marked as default, unsets default on existing stores.
 */
export async function createStore(
  tenantId: number | bigint,
  userId: string,
  input: CreateStoreInput
): Promise<StoreRecord> {
  const pTenantId = Number(tenantId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    if (input.isDefault) {
      await tx
        .update(stores)
        .set({ isDefault: false, updatedAt: sql`now()` })
        .where(eq(stores.tenantId, pTenantId));
    }

    const [created] = await tx
      .insert(stores)
      .values({
        tenantId: pTenantId,
        name: input.name,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        country: input.country ?? "India",
        pincode: input.pincode ?? null,
        latitude: input.latitude != null ? String(input.latitude) : null,
        longitude: input.longitude != null ? String(input.longitude) : null,
        deliveryMode: input.deliveryMode ?? "radius",
        deliveryRadiusKm:
          input.deliveryRadiusKm != null ? String(input.deliveryRadiusKm) : null,
        handlingFee:
          input.handlingFee != null ? String(input.handlingFee) : "0",
        minOrderPrice: input.minOrderPrice ?? 100,
        deliveryFeeValueType: input.deliveryFeeValueType ?? "fixed",
        baseDistanceKm:
          input.baseDistanceKm != null ? String(input.baseDistanceKm) : "0",
        deliveryFeeBasePrice:
          input.deliveryFeeBasePrice != null
            ? String(input.deliveryFeeBasePrice)
            : "0",
        deliveryFeePerkm:
          input.deliveryFeePerkm != null
            ? String(input.deliveryFeePerkm)
            : "0",
        deliveryFeeFixed:
          input.deliveryFeeFixed != null
            ? String(input.deliveryFeeFixed)
            : "0",
        isDefault: input.isDefault ?? false,
        isActive: input.isActive ?? true,
      })
      .returning();

    return {
      ...created,
      id: created.id.toString(),
    };
  });
}

/**
 * Updates an existing store location.
 */
export async function updateStore(
  tenantId: number | bigint,
  userId: string,
  storeId: number | bigint | string,
  input: UpdateStoreInput
): Promise<StoreRecord> {
  const pTenantId = Number(tenantId);
  const pStoreIdBigInt = Number(storeId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    if (input.isDefault) {
      await tx
        .update(stores)
        .set({ isDefault: false, updatedAt: sql`now()` })
        .where(
          and(
            eq(stores.tenantId, pTenantId),
            sql`${stores.id} != ${pStoreIdBigInt}`
          )
        );
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: sql`now()`,
    };

    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.addressLine1 !== undefined) updatePayload.addressLine1 = input.addressLine1;
    if (input.addressLine2 !== undefined) updatePayload.addressLine2 = input.addressLine2;
    if (input.city !== undefined) updatePayload.city = input.city;
    if (input.state !== undefined) updatePayload.state = input.state;
    if (input.country !== undefined) updatePayload.country = input.country;
    if (input.pincode !== undefined) updatePayload.pincode = input.pincode;
    if (input.latitude !== undefined) {
      updatePayload.latitude = input.latitude != null ? String(input.latitude) : null;
    }
    if (input.longitude !== undefined) {
      updatePayload.longitude = input.longitude != null ? String(input.longitude) : null;
    }
    if (input.deliveryMode !== undefined) updatePayload.deliveryMode = input.deliveryMode;
    if (input.deliveryRadiusKm !== undefined) {
      updatePayload.deliveryRadiusKm =
        input.deliveryRadiusKm != null ? String(input.deliveryRadiusKm) : null;
    }
    if (input.handlingFee !== undefined) {
      updatePayload.handlingFee =
        input.handlingFee != null ? String(input.handlingFee) : "0";
    }
    if (input.minOrderPrice !== undefined) updatePayload.minOrderPrice = input.minOrderPrice;
    if (input.deliveryFeeValueType !== undefined) {
      updatePayload.deliveryFeeValueType = input.deliveryFeeValueType;
    }
    if (input.baseDistanceKm !== undefined) {
      updatePayload.baseDistanceKm = String(input.baseDistanceKm);
    }
    if (input.deliveryFeeBasePrice !== undefined) {
      updatePayload.deliveryFeeBasePrice =
        input.deliveryFeeBasePrice != null ? String(input.deliveryFeeBasePrice) : "0";
    }
    if (input.deliveryFeePerkm !== undefined) {
      updatePayload.deliveryFeePerkm = String(input.deliveryFeePerkm);
    }
    if (input.deliveryFeeFixed !== undefined) {
      updatePayload.deliveryFeeFixed = String(input.deliveryFeeFixed);
    }
    if (input.isDefault !== undefined) updatePayload.isDefault = input.isDefault;
    if (input.isActive !== undefined) updatePayload.isActive = input.isActive;

    const [updated] = await tx
      .update(stores)
      .set(updatePayload)
      .where(
        and(
          eq(stores.id, pStoreIdBigInt),
          eq(stores.tenantId, pTenantId)
        )
      )
      .returning();

    if (!updated) {
      throw new AppError(404, "Store not found.");
    }

    return {
      ...updated,
      id: updated.id.toString(),
    };
  });
}

/**
 * Soft deletes a store location.
 */
export async function deleteStore(
  tenantId: number | bigint,
  userId: string,
  storeId: number | bigint | string
): Promise<{ success: boolean }> {
  const pTenantId = Number(tenantId);
  const pStoreIdBigInt = Number(storeId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const [deleted] = await tx
      .update(stores)
      .set({
        isActive: false,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(stores.id, pStoreIdBigInt),
          eq(stores.tenantId, pTenantId)
        )
      )
      .returning({ id: stores.id });

    if (!deleted) {
      throw new AppError(404, "Store not found.");
    }

    return { success: true };
  });
}