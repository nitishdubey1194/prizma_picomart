import { NextRequest } from "next/server";
import { verifyAccessToken } from "./auth.utils";
import { AuthUser } from "./auth.types";
import { AppError } from "@/lib/errors";

export function getAuthUser(req: NextRequest): AuthUser {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "Missing or invalid authorization header.");
  }

  try {
    return verifyAccessToken(header.slice(7));
  } catch {
    throw new AppError(401, "Invalid or expired access token.");
  }
}

export function getOptionalAuthUser(req: NextRequest): AuthUser | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    return verifyAccessToken(header.slice(7));
  } catch {
    return null;
  }
}