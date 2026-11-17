import { redis } from "../infra/redis";
import type { Link } from "./url.repository";

// Data access for the Redis cache of links. No decisions here: the service decides when to call what.
// If Redis is down, every function behaves like an empty cache, so the service simply falls back to Postgres.

const URL_TTL = 24 * 60 * 60; // active link: 86400 seconds
const NOT_FOUND_TTL = 60; // missing code: 60 seconds

const urlKey = (code: string) => `url:${code}`;
const notFoundKey = (code: string) => `url:${code}:not_found`;

// Run a Redis action. If Redis fails, log it and return the fallback instead of throwing.
async function safely<T>(action: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await action();
  } catch (err) {
    console.error("Cache unavailable, skipping:", (err as Error).message);
    return fallback;
  }
}

// Read a link from the cache. Returns null if it is not cached (or the cache is down).
export async function getLink(code: string): Promise<Link | null> {
  return safely(async () => {
    const cached = await redis.get(urlKey(code));
    if (!cached) return null;
    const { url, expiresAt } = JSON.parse(cached) as { url: string; expiresAt: string | null };
    return { url, expiresAt: expiresAt ? new Date(expiresAt) : null };
  }, null);
}

// Save a link in the cache. A link that expires is never kept longer than it is valid.
export async function saveLink(code: string, link: Link): Promise<void> {
  return safely(async () => {
    let ttl = URL_TTL;
    if (link.expiresAt) {
      const secondsLeft = Math.floor((link.expiresAt.getTime() - Date.now()) / 1000);
      ttl = Math.max(1, Math.min(ttl, secondsLeft));
    }
    await redis.set(urlKey(code), JSON.stringify(link), "EX", ttl);
  }, undefined);
}

// Restart the 24-hour timer of a cached link
export async function refreshLink(code: string): Promise<void> {
  return safely(async () => {
    await redis.expire(urlKey(code), URL_TTL);
  }, undefined);
}

// Remember that a code does not exist, for a short time
export async function markMissing(code: string): Promise<void> {
  return safely(async () => {
    await redis.set(notFoundKey(code), "1", "EX", NOT_FOUND_TTL);
  }, undefined);
}

// Do we already know that this code does not exist? If the cache is down: "we don't know" (false)
export async function isKnownMissing(code: string): Promise<boolean> {
  return safely(async () => (await redis.exists(notFoundKey(code))) === 1, false);
}

// Forget that a code was missing (used when a link with that code is created)
export async function clearMissing(code: string): Promise<void> {
  return safely(async () => {
    await redis.del(notFoundKey(code));
  }, undefined);
}
