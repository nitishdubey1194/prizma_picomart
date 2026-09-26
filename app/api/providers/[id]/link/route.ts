import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withUserContext } from "@/lib/db";
import { toErrorResponse } from "@/lib/errors";
import { getAuthUser } from "@/app/features/auth/auth.middleware";
import { linkProviderToUser } from "@/app/features/providers/providers.service";

const linkSchema = z.object({ userId: z.string().uuid() });

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = getAuthUser(req);
    const body = await req.json();
    const { userId } = linkSchema.parse(body);

    const provider = await withUserContext(user.id, (client) => linkProviderToUser(client, Number(id), userId));
    if (!provider) {
      return NextResponse.json({ message: "Provider not found" }, { status: 404 });
    }
    return NextResponse.json(provider, { status: 200 });
  } catch (err: unknown) {
    const { status, message } = toErrorResponse(err);
    return NextResponse.json({ message }, { status });
  }
}