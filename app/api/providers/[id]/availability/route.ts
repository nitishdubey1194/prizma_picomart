import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  getProviderWeeklySchedule,
  addRecurringBlock,
  type RecurringBlockInput,
} from "@/app/features/availability/availability.service";
import { AppError } from "@/lib/errors";

type RouteParams = RouteContext<"/api/providers/[id]/availability">;

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const providerId = Number(id);

    if (!providerId) {
      return NextResponse.json(
        { error: "A valid provider ID is required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const schedule = await getProviderWeeklySchedule(tenant.id, providerId);

    return NextResponse.json({ schedule }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to load schedule";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const providerId = Number(id);

    if (!providerId) {
      return NextResponse.json(
        { error: "A valid provider ID is required" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as RecurringBlockInput;

    if (body?.weekday === undefined || !body?.startTime || !body?.endTime) {
      return NextResponse.json(
        { error: "Fields 'weekday', 'startTime', and 'endTime' are required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const block = await addRecurringBlock(tenant.id, user.id, providerId, body);

    return NextResponse.json({ block }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to add availability block";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}