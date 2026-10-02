import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  linkUserToProvider,
  type LinkUserToProviderInput,
} from "@/app/features/providers/providers.service";
import { AppError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
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

    const body = (await request.json()) as LinkUserToProviderInput;

    // if (!body?.userId) {
    //   return NextResponse.json(
    //     { error: "Field 'userId' is required" },
    //     { status: 400 }
    //   );
    // }

    const tenant = await getCurrentTenant();
    const provider = await linkUserToProvider(
      tenant.id,
      user.id,
      providerId,
      body
    );

    return NextResponse.json({ provider }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to link user to provider";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}