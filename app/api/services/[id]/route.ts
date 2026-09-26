import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { AppError, toErrorResponse } from "@/lib/errors";
import { getAuthUser, getOptionalAuthUser } from "@/app/features/auth/auth.middleware";
import { updateServiceSchema } from "@/app/features/services/services.schema";
import { getServiceById, updateService, deleteService } from "@/app/features/services/services.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getOptionalAuthUser(req);
    const service = await withUserContext(user?.id ?? null, (client) => getServiceById(client, Number(id)));
    if (!service) throw new AppError(404, "Service not found.");
    return NextResponse.json(service, { status: 200 });
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
    const data = updateServiceSchema.parse(body);
    const service = await withUserContext(user.id, (client) => updateService(client, Number(id), data));
    if (!service) throw new AppError(404, "Service not found.");
    return NextResponse.json(service, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getAuthUser(req);
    const deleted = await withUserContext(user.id, (client) => deleteService(client, Number(id)));
    if (!deleted) throw new AppError(404, "Service not found.");
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}