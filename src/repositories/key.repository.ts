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

// Reserve a code a user chose, so the KGS will never hand it out.
// Returns false if the code is already taken.
export async function reserveKey(client: PoolClient, code: string): Promise<boolean> {
  // Case 1: the code is in the stock and free -> take it (this locks the row)
  const updated = await client.query(
    `UPDATE preallocated_keys
     SET status = 'allocated'
     WHERE short_code = $1 AND status = 'available'`,
    [code]
  );
  if (updated.rowCount === 1) return true;

  // Case 2: the code is not in the stock yet -> add it as taken.
  // Case 3: it is already taken -> the INSERT conflicts and adds nothing.
  const inserted = await client.query(
    `INSERT INTO preallocated_keys (short_code, status)
     VALUES ($1, 'allocated')
     ON CONFLICT (short_code) DO NOTHING`,
    [code]
  );
  return inserted.rowCount === 1;
}
