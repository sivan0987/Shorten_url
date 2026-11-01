import type { Request, Response, NextFunction } from "express";
import { InvalidUrlError } from "../errors/appErrors";

function isValidUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Middleware: runs before the route handler.
// Invalid URL -> throw, and the error handler answers 400. Valid URL -> pass the request on with next().
export function validateUrl(req: Request, res: Response, next: NextFunction) {
  if (!isValidUrl(req.body?.url)) {
    throw new InvalidUrlError();
  }
  next();
}
