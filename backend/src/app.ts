import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(express.json({ limit: "10mb" }));
  app.use(
    cors({
      origin: config.corsAllowedOrigins === "*"
        ? "*"
        : config.corsAllowedOrigins.split(",").map((o) => o.trim()),
    })
  );
  app.use(morgan("dev"));

  app.use(routes);

  app.use(errorHandler);

  return app;
}
