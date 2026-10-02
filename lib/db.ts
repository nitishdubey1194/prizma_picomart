import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/drizzle/schema";
import * as relations from "@/drizzle/relations";

const connectionString = process.env.DATABASE_URL!;

export const client = postgres(connectionString, {
  prepare: false,
  max: process.env.NODE_ENV === "production" ? 10 : 1,
});

export const db = drizzle(client, {
  schema: { ...schema, ...relations },
});