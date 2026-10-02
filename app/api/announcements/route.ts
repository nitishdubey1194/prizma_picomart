import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  getActiveAnnouncements,
  getAllTenantAnnouncements,
  createAnnouncement,
  type CreateAnnouncementInput,
} from "@/app/features/announcements/announcements.service";
import { AppError } from "@/lib/errors";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const all = searchParams.get("all") === "true";

    const tenant = await getCurrentTenant();

    const list = all
      ? await getAllTenantAnnouncements(tenant.id)
      : await getActiveAnnouncements(tenant.id, storeId);

    return NextResponse.json({ announcements: list }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to load announcements";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateAnnouncementInput;

    if (!body?.title) {
      return NextResponse.json(
        { error: "Field 'title' is required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const created = await createAnnouncement(tenant.id, user.id, body);

    return NextResponse.json({ announcement: created }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to create announcement";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}