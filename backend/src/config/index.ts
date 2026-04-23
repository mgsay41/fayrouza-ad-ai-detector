import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  port: parseInt(optional("PORT", "3001"), 10),
  nodeEnv: optional("NODE_ENV", "development"),

  webhookApiKey: required("WEBHOOK_API_KEY"),
  internalApiKey: required("INTERNAL_API_KEY"),
  adminApiKey: required("ADMIN_API_KEY"),

  geminiApiKey: required("GEMINI_API_KEY"),
  geminiModel: optional("GEMINI_MODEL", "gemini-2.5-flash"),

  fayrouzaApiUrl: required("FAYROUZA_API_URL"),
  fayrouzaServiceToken: required("FAYROUZA_SERVICE_TOKEN"),

  redisHost: optional("REDIS_HOST", "127.0.0.1"),
  redisPort: parseInt(optional("REDIS_PORT", "6379"), 10),

  scoreAutoApprove: parseInt(optional("SCORE_AUTO_APPROVE", "80"), 10),
  scoreNeedsReview: parseInt(optional("SCORE_NEEDS_REVIEW", "40"), 10),

  marketplaceCurrency: optional("MARKETPLACE_CURRENCY", "EGP"),

  queueConcurrency: (() => { const n = parseInt(optional("QUEUE_CONCURRENCY", "1"), 10); return Math.min(6, Math.max(1, isNaN(n) ? 1 : n)); })(),

  corsAllowedOrigins: optional("CORS_ALLOWED_ORIGINS", "*"),
};
