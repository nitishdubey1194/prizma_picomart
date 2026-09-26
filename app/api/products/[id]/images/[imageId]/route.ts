import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { AppError, toErrorResponse } from "@/lib/errors";
import { getAuthUser } from "@/app/features/auth/auth.middleware";
import { setPrimaryImage, deleteImage } from "@/app/features/products/product-images.service";

interface RouteParams {
  params: Promise<{ id: string; imageId: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id, imageId } = await params;
    const user = getAuthUser(req);
    const image = await withUserContext(user.id, (client) => setPrimaryImage(client, Number(id), Number(imageId)));
    if (!image) throw new AppError(404, "Image not found.");
    return NextResponse.json(image, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { imageId } = await params;
    const user = getAuthUser(req);
    const deleted = await withUserContext(user.id, (client) => deleteImage(client, Number(imageId)));
    if (!deleted) throw new AppError(404, "Image not found.");
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}