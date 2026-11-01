import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/appErrors";

// Last stop for every error. Express recognizes an error handler by its 4 parameters,
// so all 4 must stay even though "next" is not used.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Known business errors: 404, 410, 503
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  // The request body was not valid JSON
  if ((err as { type?: string })?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  // Anything else is our bug: log the details, but don't show them to the user
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
