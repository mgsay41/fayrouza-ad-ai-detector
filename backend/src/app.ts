import express from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import routes from "./routes";
import { openApiSpec } from "./swagger";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(express.json({ limit: "10mb" }));

  const allowedOrigins =
    config.corsAllowedOrigins === "*"
      ? "*"
      : config.corsAllowedOrigins.split(",").map((o) => o.trim());

  app.use(
    cors({
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "X-API-Key", "Authorization"],
      exposedHeaders: [
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
      ],
    })
  );

  app.use(morgan("dev"));

  // Interactive API documentation
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

  // Raw OpenAPI JSON spec (for SDK generators, Postman import, etc.)
  app.get("/openapi.json", (_req, res) => {
    res.json(openApiSpec);
  });

  app.use(routes);

  app.use(errorHandler);

  return app;
}
