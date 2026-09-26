import { Pool, PoolClient, types } from "pg";
types.setTypeParser(1082, (value: string) => value);
const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

/**
 * Runs fn inside a transaction with the given user id set as the Postgres
 * session context, so RLS policies calling auth.uid() see the right user.
 * Pass null for system/unauthenticated queries (auth.uid() returns null).
 */
export async function withUserContext<T>(
  userId: string | null,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (userId) {
      await client.query("select set_config('app.current_user_id', $1, true)", [userId]);
    }
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}