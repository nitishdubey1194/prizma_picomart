import { db } from "@/lib/db";
import { announcements, stores } from "@/drizzle/schema";
import { withTenantContext } from "@/lib/tenant";
import { AppError } from "@/lib/errors";
import { and, eq, desc, sql } from "drizzle-orm";

export interface CreateAnnouncementInput {
  title: string;
  storeId?: number | bigint | string | null;
  status?: "draft" | "published";
}

export interface UpdateAnnouncementInput {
  title?: string;
  storeId?: number | bigint | string | null;
  status?: "draft" | "published";
}

export interface AnnouncementRecord {
  id: string;
  tenantId: number;
  storeId: number | null;
  title: string;
  status: "draft" | "published" | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Lists published announcements visible to customers, optionally filtered by store outlet.
 */
export async function getActiveAnnouncements(
  tenantId: number | bigint,
  storeId?: number | bigint | string | null
): Promise<AnnouncementRecord[]> {
  const pTenantId = Number(tenantId);
  const conditions = [
    eq(announcements.tenantId, pTenantId),
    eq(announcements.status, "published"),
  ];

  if (storeId) {
    conditions.push(eq(announcements.storeId, Number(storeId)));
  }

  const rows = await db
    .select()
    .from(announcements)
    .where(and(...conditions))
    .orderBy(desc(announcements.createdAt));

  return rows.map((a) => ({
    ...a,
    id: a.id.toString(),
  }));
}

/**
 * Lists all announcements (drafts and published) for administration.
 */
export async function getAllTenantAnnouncements(
  tenantId: number | bigint
): Promise<AnnouncementRecord[]> {
  const pTenantId = Number(tenantId);

  const rows = await db
    .select()
    .from(announcements)
    .where(eq(announcements.tenantId, pTenantId))
    .orderBy(desc(announcements.createdAt));

  return rows.map((a) => ({
    ...a,
    id: a.id.toString(),
  }));
}

/**
 * Creates an announcement under tenant context.
 */
export async function createAnnouncement(
  tenantId: number | bigint,
  userId: string,
  input: CreateAnnouncementInput
): Promise<AnnouncementRecord> {
  const pTenantId = Number(tenantId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    if (input.storeId) {
      const [store] = await tx
        .select({ id: stores.id })
        .from(stores)
        .where(
          and(
            eq(stores.id, BigInt(input.storeId)),
            eq(stores.tenantId, pTenantId)
          )
        )
        .limit(1);

      if (!store) {
        throw new AppError(404, "Specified store outlet does not exist.");
      }
    }

    const [created] = await tx
      .insert(announcements)
      .values({
        tenantId: pTenantId,
        storeId: input.storeId != null ? Number(input.storeId) : null,
        title: input.title,
        status: input.status ?? "draft",
      })
      .returning();

    return {
      ...created,
      id: created.id.toString(),
    };
  });
}

/**
 * Updates an announcement's content or status.
 */
export async function updateAnnouncement(
  tenantId: number | bigint,
  userId: string,
  announcementId: number | bigint | string,
  input: UpdateAnnouncementInput
): Promise<AnnouncementRecord> {
  const pTenantId = Number(tenantId);
  const pAnnouncementIdBigInt = BigInt(announcementId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const updatePayload: Record<string, unknown> = {
      updatedAt: sql`now()`,
    };

    if (input.title !== undefined) updatePayload.title = input.title;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.storeId !== undefined) {
      updatePayload.storeId =
        input.storeId != null ? Number(input.storeId) : null;
    }

    const [updated] = await tx
      .update(announcements)
      .set(updatePayload)
      .where(
        and(
          eq(announcements.id, pAnnouncementIdBigInt),
          eq(announcements.tenantId, pTenantId)
        )
      )
      .returning();

    if (!updated) {
      throw new AppError(404, "Announcement not found.");
    }

    return {
      ...updated,
      id: updated.id.toString(),
    };
  });
}

/**
 * Deletes an announcement.
 */
export async function deleteAnnouncement(
  tenantId: number | bigint,
  userId: string,
  announcementId: number | bigint | string
): Promise<{ success: boolean }> {
  const pTenantId = Number(tenantId);
  const pAnnouncementIdBigInt = BigInt(announcementId);

  return await withTenantContext(pTenantId, userId, async (tx) => {
    const deleted = await tx
      .delete(announcements)
      .where(
        and(
          eq(announcements.id, pAnnouncementIdBigInt),
          eq(announcements.tenantId, pTenantId)
        )
      )
      .returning({ id: announcements.id });

    if (!deleted.length) {
      throw new AppError(404, "Announcement not found.");
    }

    return { success: true };
  });
}