import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getAuthUser, getOptionalAuthUser } from "@/app/features/auth/auth.middleware";
import { getCurrentTenant } from "@/lib/tenant";
import { createVariantSchema } from "@/app/features/products/products.schema";
import { listVariants, createVariant } from "@/app/features/products/product-variants.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getOptionalAuthUser(req);
    const variants = await withUserContext(user?.id ?? null, (client) => listVariants(client, Number(id)));
    return NextResponse.json(variants, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getAuthUser(req);
    const body = await req.json();
    const data = createVariantSchema.parse(body);
    const tenant = await getCurrentTenant();
    const variant = await withUserContext(user.id, (client) => createVariant(client, tenant.id, Number(id), data));
    return NextResponse.json(variant, { status: 201 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}