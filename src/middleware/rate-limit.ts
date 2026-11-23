import type { Request, Response, NextFunction } from "express";
import { redis } from "../infra/redis";
import { TooManyRequestsError } from "../errors/appErrors";

const LIMIT = 10; // requests allowed per IP...
const WINDOW_SECONDS = 60; // ...in each window of this many seconds

// Middleware: fixed-window rate limit per IP, counted in Redis so all servers share it.
export async function rateLimit(req: Request, res: Response, next: NextFunction) {
  const key = `rate:${req.ip}`;
  let count: number;

  try {
    // 1. Add 1 and read the new value in one atomic step (no race between read and write)
    count = await redis.incr(key);

    // 2. First request of the window: start the timer once, never reset it
    if (count === 1) await redis.expire(key, WINDOW_SECONDS);
  } catch (err) {
    // Fail open: if Redis is down, let real users keep creating links, just without a limit
    console.error("Rate limit unavailable, skipping:", (err as Error).message);
    return next();
  }

  // 3. Over the limit: the error handler answers 429
  if (count > LIMIT) throw new TooManyRequestsError();

  // 4. Within the limit: pass the request on
  next();
}
