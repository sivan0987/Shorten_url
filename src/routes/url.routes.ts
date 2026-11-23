import { Router } from "express";
import * as urlController from "../controllers/url.controller";
import { validateUrl } from "../middleware/validate-url";
import { rateLimit } from "../middleware/rate-limit";

// Which URL path goes to which controller function
export const urlRouter = Router();

// rateLimit runs first, so invalid requests are counted too
urlRouter.post("/api/v1/urls", rateLimit, validateUrl, urlController.shorten);
urlRouter.get("/:code", urlController.redirect);
