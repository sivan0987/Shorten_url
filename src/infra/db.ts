import { Pool, type PoolClient } from "pg";
import { config } from "../config";

// One shared pool of connections to Postgres for the whole app
export const pool = new Pool(config.db);

// Run several queries as one transaction: all succeed together, or all are undone.
export async function withTransaction<T>( work: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
