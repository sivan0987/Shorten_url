import type { Request, Response } from "express";
import * as urlService from "../services/url.service";

// HTTP layer: read the request, call the service, send the response.
// Errors thrown by the service go automatically to the error-handler middleware.

export async function shorten(req: Request, res: Response) {
  const result = await urlService.shortenUrl(req.body.url);
  res.status(201).json(result);
}

export async function redirect(req: Request<{ code: string }>, res: Response) {
  const originalUrl = await urlService.getOriginalUrl(req.params.code);
  
  res.redirect(302, originalUrl);
}
