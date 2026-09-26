import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { AppError, toErrorResponse } from "@/lib/errors";
import { getAuthUser, getOptionalAuthUser } from "@/app/features/auth/auth.middleware";
import { updateProviderSchema } from "@/app/features/providers/providers.schema";
import { getProviderById, updateProvider, deleteProvider } from "@/app/features/providers/providers.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getOptionalAuthUser(req);
    const provider = await withUserContext(user?.id ?? null, (client) => getProviderById(client, Number(id)));
    if (!provider) throw new AppError(404, "Provider not found.");
    return NextResponse.json(provider, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getAuthUser(req);
    const body = await req.json();
    const data = updateProviderSchema.parse(body);
    const provider = await withUserContext(user.id, (client) => updateProvider(client, Number(id), data));
    if (!provider) throw new AppError(404, "Provider not found.");
    return NextResponse.json(provider, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getAuthUser(req);
    const deleted = await withUserContext(user.id, (client) => deleteProvider(client, Number(id)));
    if (!deleted) throw new AppError(404, "Provider not found.");
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}