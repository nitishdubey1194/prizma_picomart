import { NextRequest, NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/tenant";
import { getAuthUser } from "@/app/features/auth/auth.utils";
import {
  getTenantProducts,
  createProduct,
  type CreateProductInput,
} from "@/app/features/products/products.service";
import { AppError } from "@/lib/errors";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const featuredParam = searchParams.get("featured");
    const search = searchParams.get("search") ?? undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : undefined;

    const featured =
      featuredParam === "true" ? true : featuredParam === "false" ? false : undefined;

    const tenant = await getCurrentTenant();
    const productList = await getTenantProducts(tenant.id, {
      categoryId,
      featured,
      search,
      limit,
      offset,
    });

    return NextResponse.json({ products: productList }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to fetch products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateProductInput;

    if (!body?.name || !body?.slug) {
      return NextResponse.json(
        { error: "Fields 'name' and 'slug' are required" },
        { status: 400 }
      );
    }

    const tenant = await getCurrentTenant();
    const product = await createProduct(tenant.id, user.id, body);

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}