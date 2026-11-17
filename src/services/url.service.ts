import { config } from "../config";
import * as urlRepository from "../repositories/url.repository";
import * as urlCache from "../repositories/url.cache";
import * as appErrors from "../errors/appErrors";


export async function shortenUrl(originalUrl: string) {
  const shortCode = await urlRepository.createShortUrl(originalUrl);
  if (!shortCode) throw new appErrors.NoKeysAvailableError();

  // If someone tried this code before it existed, forget the old "not found"
  await urlCache.clearMissing(shortCode);

  return { shortCode, shortUrl: `${config.baseUrl}/${shortCode}` };
}

// Read-Through: try the cache first, then the database
export async function getOriginalUrl(code: string): Promise<string> {
  // Step 1: cache hit - answer from Redis, without asking Postgres
  const cached = await urlCache.getLink(code);
  if (cached) {
    throwIfExpired(cached.expiresAt);
    // Renew the 24-hour timer, but only for links that never expire
    if (!cached.expiresAt) await urlCache.refreshLink(code);
    return cached.url;
  }

  // Step 2: negative cache - we already know this code does not exist
  if (await urlCache.isKnownMissing(code)) throw new appErrors.NotFoundError();

  // Step 3: cache miss - ask Postgres
  const link = await urlRepository.findByCode(code);
  if (!link) {
    await urlCache.markMissing(code);
    throw new appErrors.NotFoundError();
  }

  throwIfExpired(link.expiresAt);

  // Step 4: save in the cache for next time
  await urlCache.saveLink(code, link);

  return link.url;
}

function throwIfExpired(expiresAt: Date | null) {
  if (expiresAt && expiresAt < new Date()) throw new appErrors.LinkExpiredError();
}
