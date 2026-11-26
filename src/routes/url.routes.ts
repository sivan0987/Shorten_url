import { Router } from "express";
import * as urlController from "../controllers/url.controller";
import { validateUrl } from "../middleware/validate-url";
import { rateLimit } from "../middleware/rate-limit";
import { validateCustomCode } from "../middleware/validate-custom-code";

// Which URL path goes to which controller function
export const urlRouter = Router();

// rateLimit runs first, so invalid requests are counted too
urlRouter.post(
  "/api/v1/urls",
  rateLimit,
  validateUrl,
  validateCustomCode,
  urlController.shorten
);
urlRouter.get("/:code", urlController.redirect);
