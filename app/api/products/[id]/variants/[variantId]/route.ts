import { NextRequest, NextResponse } from "next/server";
import {
  updateProductVariant,
  deleteProductVariant,
  UpdateVariantInput,
  VariantAttributes,
  JsonValue,
} from "@/app/features/products/product-variants.service";
import { AppError } from "@/lib/errors";

type ProductVariantRouteParams = RouteContext<"/api/products/[id]/variants/[variantId]">;

interface UpdateVariantBody {
  variantName?: string;
  sku?: string | null;
  price?: string | number;
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

export async function PATCH(
  req: NextRequest,
  context: ProductVariantRouteParams
): Promise<NextResponse> {
  try {
    const { variantId } = await context.params;
    const tenantId = parseTenantId(req);
    const userId = parseUserId(req);

    const body: unknown = await req.json();
    if (!body || typeof body !== "object") {
      throw new AppError(400, "Invalid JSON request body.");
    }

    const payload = body as Partial<UpdateVariantBody>;
    const input: UpdateVariantInput = {};

    if (payload.variantName !== undefined) {
      if (typeof payload.variantName !== "string" || !payload.variantName.trim()) {
        throw new AppError(400, "Field 'variantName' must be a non-empty string.");
      }
      input.variantName = payload.variantName.trim();
    }

    if (payload.sku !== undefined) {
      input.sku = typeof payload.sku === "string" ? payload.sku.trim() || null : null;
    }

    if (payload.price !== undefined) {
      if (Number.isNaN(Number(payload.price)) || Number(payload.price) < 0) {
        throw new AppError(400, "Field 'price' must be a non-negative number.");
      }
      input.price = payload.price;
    }

    if (payload.discountPrice !== undefined) {
      if (payload.discountPrice !== null && (Number.isNaN(Number(payload.discountPrice)) || Number(payload.discountPrice) < 0)) {
        throw new AppError(400, "Field 'discountPrice' must be a valid non-negative number or null.");
      }
      input.discountPrice = payload.discountPrice;
    }

    if (payload.stockQty !== undefined) {
      if (!Number.isInteger(payload.stockQty) || payload.stockQty < 0) {
        throw new AppError(400, "Field 'stockQty' must be a non-negative integer.");
      }
      input.stockQty = payload.stockQty;
    }

    if (payload.maxBuyQty !== undefined) {
      if (payload.maxBuyQty !== null && (!Number.isInteger(payload.maxBuyQty) || payload.maxBuyQty <= 0)) {
        throw new AppError(400, "Field 'maxBuyQty' must be a positive integer or null.");
      }
      input.maxBuyQty = payload.maxBuyQty;
    }

    if (payload.attributesJson !== undefined) {
      if (payload.attributesJson !== null && !isJsonObject(payload.attributesJson)) {
        throw new AppError(400, "Field 'attributesJson' must be a valid JSON object or null.");
      }
      input.attributesJson = payload.attributesJson;
    }

    const updated = await updateProductVariant(tenantId, userId, variantId, input);

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
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

export async function DELETE(
  req: NextRequest,
  context: ProductVariantRouteParams
): Promise<NextResponse> {
  try {
    const { variantId } = await context.params;
    const tenantId = parseTenantId(req);
    const userId = parseUserId(req);

    const result = await deleteProductVariant(tenantId, userId, variantId);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
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