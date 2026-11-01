import type { PoolClient } from "pg";

// Data access for the preallocated_keys table (the stock of codes)

// Atomically take one available code and mark it allocated.
// SKIP LOCKED lets concurrent requests each grab a different code without waiting.
// Returns null when the stock is empty.
export async function allocateKey(client: PoolClient): Promise<string | null> {
  const result = await client.query(
    `UPDATE preallocated_keys
     SET status = 'allocated'
     WHERE id = (
       SELECT id FROM preallocated_keys
       WHERE status = 'available'
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING short_code`
  );
  return result.rows[0]?.short_code ?? null;
}
