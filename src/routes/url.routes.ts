import { Router } from "express";
import * as urlController from "../controllers/url.controller";
import { validateUrl } from "../middleware/validate-url";

// Which URL path goes to which controller function
export const urlRouter = Router();

urlRouter.post("/api/v1/urls", validateUrl, urlController.shorten);
urlRouter.get("/:code", urlController.redirect);
