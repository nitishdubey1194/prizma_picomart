import { PoolClient } from "pg";

export type UserSearchResult = { id: string; email: string };

export async function searchUsersByEmail(client: PoolClient, email: string): Promise<UserSearchResult[]> {
  const result = await client.query(
    "select id, email from users where email ilike $1 order by email limit 10",
    [`%${email}%`]
  );
  return result.rows;
}