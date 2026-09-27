import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schemaModels from "@/drizzle/schema";
import * as relationsModels from "@/drizzle/relations";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

// Combine all tables and relations definitions into one schema
export const schema = { ...schemaModels, ...relationsModels };
export type AppSchema = typeof schema;

export const client = postgres(connectionString, {
  prepare: false,
  max: process.env.NODE_ENV === "production" ? 10 : 1,
});

// Pass the combined schema into drizzle
export const db = drizzle(client, { schema });

// Re-export tables and relations for convenience
export * from "@/drizzle/schema";
export * from "@/drizzle/relations";