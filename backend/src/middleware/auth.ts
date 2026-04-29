import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { config } from "../config";

type ApiKeyScope = "webhook" | "internal" | "admin" | "public";

const keysByScope: Record<ApiKeyScope, string> = {
  webhook: config.webhookApiKey,
  internal: config.internalApiKey,
  admin: config.adminApiKey,
  public: config.publicApiKey,
};

function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  const len = Math.max(bufA.length, bufB.length);
  const paddedA = Buffer.alloc(len);
  bufA.copy(paddedA);
  const paddedB = Buffer.alloc(len);
  bufB.copy(paddedB);
  return crypto.timingSafeEqual(paddedA, paddedB);
}

export function authenticate(scope: ApiKeyScope) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const headerKey = req.headers["x-api-key"];

    if (typeof headerKey !== "string" || !headerKey) {
      res.status(401).json({
        success: false,
        error: "Missing X-API-Key header",
        code: "UNAUTHORIZED",
      });
      return;
    }

    const expected = keysByScope[scope];

    if (!timingSafeCompare(headerKey, expected)) {
      res.status(403).json({
        success: false,
        error: "Invalid API key",
        code: "FORBIDDEN",
      });
      return;
    }

    next();
  };
}
