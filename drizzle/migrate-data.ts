import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema"; // adjust to your schema path

async function migrateData() {
  const localClient = postgres(process.env.LOCAL_DATABASE_URL!);
  const supabaseClient = postgres(process.env.SUPABASE_DATABASE_URL!, {
    prepare: false, // Essential for Supabase pooled connections
  });

  const localDb = drizzle(localClient, { schema });
  const supabaseDb = drizzle(supabaseClient, { schema });

  console.log("Starting data migration...");

  // Transfer tables strictly parent-first to satisfy foreign keys
  const transfer = async <T extends keyof typeof schema>(
    tableName: string,
    tableObj: any
  ) => {
    console.log(`Migrating ${tableName}...`);
    const rows = await localDb.select().from(tableObj);
    if (rows.length > 0) {
      // Chunk inserts in batches of 500 to avoid query size limits
      const chunkSize = 500;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        await supabaseDb.insert(tableObj).values(chunk).onConflictDoNothing();
      }
      console.log(`✓ Inserted ${rows.length} rows into ${tableName}`);
    } else {
      console.log(`- ${tableName} is empty`);
    }
  };

  try {
    // 1. Independent parent tables first
    await transfer("users", schema.users);
    
    await transfer("tenants", schema.tenants);


    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await localClient.end();
    await supabaseClient.end();
  }
}

migrateData();