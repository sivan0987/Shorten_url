import type { PoolClient } from "pg";
import * as db from "../infra/db";
import * as keyRepository from "./key.repository";
import { couldBeKgsCode } from "../utils/base62";

// Data access for the short_urls table (the links)

export interface Link {
  url: string;
  expiresAt: Date | null;
}

// Create a link with a fresh code from the stock.
// Taking the code and saving the link happen in ONE transaction:
// either both happen, or neither (so no code is ever lost).
// Returns the new code, or null if the stock is empty.
export async function createShortUrl(originalUrl: string): Promise<string | null> {
  return db.withTransaction(async (client) => {
    const code = await keyRepository.allocateKey(client);
    if (!code) return null;
    await insertUrl(client, code, originalUrl);
    return code;
  });
}

// Create a link with a code the user chose. One transaction, like createShortUrl.
// Returns false if the code is already taken.
export async function createCustomUrl(code: string, originalUrl: string): Promise<boolean> {
  return db.withTransaction(async (client) => {
    // Only a code the KGS could produce must be blocked in the stock
    if (couldBeKgsCode(code)) {
      const reserved = await keyRepository.reserveKey(client, code);
      if (!reserved) return false;
    }

    // ON CONFLICT: two users asking for the same code at once -> one gets false
    const result = await client.query(
      `INSERT INTO short_urls (short_code, original_url, is_custom)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (short_code) DO NOTHING`,
      [code, originalUrl]
    );
    return result.rowCount === 1;
  });
}

export async function findByCode(shortCode: string): Promise<Link | null> {
  const result = await db.pool.query(
    `SELECT original_url, expires_at
     FROM short_urls
     WHERE short_code = $1`,
    [shortCode]
  );
  const row = result.rows[0];
  if (!row) return null;
  return { url: row.original_url, expiresAt: row.expires_at };
}

// Internal: used only inside createShortUrl's transaction
async function insertUrl(
  client: PoolClient,
  shortCode: string,
  originalUrl: string
): Promise<void> {
  await client.query(
    `INSERT INTO short_urls (short_code, original_url)
     VALUES ($1, $2)`,
    [shortCode, originalUrl]
  );
}
