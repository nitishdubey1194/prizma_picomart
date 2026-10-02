// app/api/providers/categories/route.ts
import { NextResponse } from "next/server";
import { PROVIDER_CATEGORIES } from "@/app/features/providers/providers.schema";

export async function GET() {
  return NextResponse.json({ data: PROVIDER_CATEGORIES });
}