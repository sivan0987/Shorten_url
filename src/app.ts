import express from "express";
import { urlRouter } from "./routes/url.routes";
import { errorHandler } from "./middleware/error-handler";

// Builds the Express app: global middleware, routes, and the error handler (always last)
export const app = express();

app.use(express.json());
app.use(urlRouter);
app.use(errorHandler);
