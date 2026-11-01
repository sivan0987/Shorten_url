import { config } from "../config";
import * as urlRepository from "../repositories/url.repository";
import * as appErrors from "../errors/appErrors";


export async function shortenUrl(originalUrl: string) {
  const shortCode = await urlRepository.createShortUrl(originalUrl);
  if (!shortCode) throw new appErrors.NoKeysAvailableError();

  return { shortCode, shortUrl: `${config.baseUrl}/${shortCode}` };
}

export async function getOriginalUrl(code: string): Promise<string> {
  const link = await urlRepository.findByCode(code);
  if (!link) throw new appErrors.NotFoundError();

  throwIfExpired(link.expiresAt);
  return link.url;
}

function throwIfExpired(expiresAt: Date | null) {
  if (expiresAt && expiresAt < new Date()) throw new appErrors.LinkExpiredError();
}
