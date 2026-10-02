import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  getProviderBySlug,
  getProviderById,
  updateProvider,
  deleteProvider,
  type UpdateProviderInput,
} from "@/app/features/providers/providers.service";
import { AppError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenant = await getCurrentTenant();
  const tenantId = tenant?.id;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant context missing" }, { status: 400 });
  }
  const provider = !isNaN(Number(id))
    ? await getProviderById(Number(tenantId), Number(id))
    : await getProviderBySlug(Number(tenantId), id);

  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  return NextResponse.json({ data: provider });
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    // 1. Authenticate user
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Resolve parameters & validate numeric ID
    const { id } = await params;
    const providerId = Number(id);

    if (isNaN(providerId) || providerId <= 0) {
      return NextResponse.json(
        { error: "A valid positive provider ID is required" },
        { status: 400 }
      );
    }

    // 3. Resolve tenant context
    const tenant = await getCurrentTenant();

    // 4. Parse & sanitize payload
    const body = (await request.json()) as UpdateProviderInput;
    const sanitizedInput: UpdateProviderInput = {
      name: body.name,
      slug: body.slug,
      category: body.category,
      title: body.title,
      bio: body.bio,
      avatarUrl: body.avatarUrl,
      isActive: body.isActive,
    };

    // 5. Execute transactional update
    const updated = await updateProvider(
      tenant.id,
      user.id,
      providerId,
      sanitizedInput
    );

    return NextResponse.json({ provider: updated }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to update provider";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
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

    const tenant = await getCurrentTenant();
    const result = await deleteProvider(tenant.id, user.id, providerId);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to delete provider";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}