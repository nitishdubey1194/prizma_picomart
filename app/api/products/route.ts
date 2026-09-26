import { NextRequest, NextResponse } from "next/server";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getAuthUser, getOptionalAuthUser } from "@/app/features/auth/auth.middleware";
import { getCurrentTenant } from "@/lib/tenant";
import { createProductSchema } from "@/app/features/products/products.schema";
import { listProducts, createProduct } from "@/app/features/products/products.service";

export async function GET(req: NextRequest) {
  try {
    const user = getOptionalAuthUser(req);
    const products = await withUserContext(user?.id ?? null, (client) => listProducts(client));
    return NextResponse.json(products, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    const body = await req.json();
    const data = createProductSchema.parse(body);
    const tenant = await getCurrentTenant();
    const product = await withUserContext(user.id, (client) => createProduct(client, tenant.id, data));
    return NextResponse.json(product, { status: 201 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}