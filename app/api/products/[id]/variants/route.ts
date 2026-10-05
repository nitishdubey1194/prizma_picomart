import { NextRequest, NextResponse } from "next/server";
import {
  getVariantsByProduct,
  createProductVariant,
  CreateVariantInput,
  VariantAttributes,
  JsonValue,
} from "@/app/features/products/product-variants.service";
import { AppError } from "@/lib/errors";

type ProductVariantsRouteParams = RouteContext<"/api/products/[id]/variants">;

interface CreateVariantBody {
  variantName: string;
  sku?: string | null;
  price: string | number;
  discountPrice?: string | number | null;
  stockQty?: number;
  maxBuyQty?: number | null;
  attributesJson?: VariantAttributes | null;
}

function isJsonObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTenantId(req: NextRequest): number {
  const tenantIdHeader =
    req.headers.get("x-tenant-id") ?? req.nextUrl.searchParams.get("tenantId");

  if (!tenantIdHeader) {
    throw new AppError(400, "Missing required 'x-tenant-id' header or query parameter.");
  }

  const tenantId = Number(tenantIdHeader);
  if (Number.isNaN(tenantId) || tenantId <= 0) {
    throw new AppError(400, "Invalid tenant identifier.");
  }

  return tenantId;
}

function parseUserId(req: NextRequest): string {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    throw new AppError(401, "Unauthorized: missing user identifier.");
  }
  return userId;
}

export async function GET(
  req: NextRequest,
  context: ProductVariantsRouteParams
): Promise<NextResponse> {
  try {
    const { id: productId } = await context.params;
    const tenantId = parseTenantId(req);

    const variants = await getVariantsByProduct(tenantId, productId);
    return NextResponse.json({ success: true, data: variants }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: ProductVariantsRouteParams
): Promise<NextResponse> {
  try {
    const { id: productId } = await context.params;
    const tenantId = parseTenantId(req);
    const userId = parseUserId(req);

    const body: unknown = await req.json();
    if (!body || typeof body !== "object") {
      throw new AppError(400, "Invalid JSON request body.");
    }

    const payload = body as Partial<CreateVariantBody>;

    if (!payload.variantName || typeof payload.variantName !== "string" || !payload.variantName.trim()) {
      throw new AppError(400, "Field 'variantName' is required and must be a non-empty string.");
    }

    if (payload.price === undefined || payload.price === null || (typeof payload.price !== "string" && typeof payload.price !== "number")) {
      throw new AppError(400, "Field 'price' is required and must be a valid number or string decimal.");
    }

    if (Number.isNaN(Number(payload.price)) || Number(payload.price) < 0) {
      throw new AppError(400, "Field 'price' must be a non-negative number.");
    }

    if (payload.discountPrice !== undefined && payload.discountPrice !== null) {
      if (Number.isNaN(Number(payload.discountPrice)) || Number(payload.discountPrice) < 0) {
        throw new AppError(400, "Field 'discountPrice' must be a valid non-negative number.");
      }
    }

    if (payload.stockQty !== undefined && (!Number.isInteger(payload.stockQty) || payload.stockQty < 0)) {
      throw new AppError(400, "Field 'stockQty' must be a non-negative integer.");
    }

    if (payload.attributesJson !== undefined && payload.attributesJson !== null && !isJsonObject(payload.attributesJson)) {
      throw new AppError(400, "Field 'attributesJson' must be a valid JSON object or null.");
    }

    const input: CreateVariantInput = {
      variantName: payload.variantName.trim(),
      sku: typeof payload.sku === "string" ? payload.sku.trim() || null : null,
      price: payload.price,
      discountPrice: payload.discountPrice ?? null,
      stockQty: payload.stockQty ?? 0,
      maxBuyQty: payload.maxBuyQty ?? null,
      attributesJson: payload.attributesJson ?? null,
    };

    const newVariant = await createProductVariant(tenantId, userId, productId, input);

    return NextResponse.json({ success: true, data: newVariant }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}