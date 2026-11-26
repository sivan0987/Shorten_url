import type { Request, Response, NextFunction } from "express";
import { InvalidCustomCodeError } from "../errors/appErrors";
import { isValidCustomCode } from "../utils/custom-code";

// customCode is optional: no code -> the KGS gives one later.
// A code that was sent must pass the rules, or we answer 400.
export function validateCustomCode(req: Request, res: Response, next: NextFunction) {
  const code = req.body?.customCode;

  if (code !== undefined && !isValidCustomCode(code)) {
    throw new InvalidCustomCodeError();
  }
  next();
}
