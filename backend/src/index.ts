import { config } from "./config";
import { createApp } from "./app";
import logger from "./utils/logger";
import { moderationQueue } from "./services/queue/moderationQueue";

const app = createApp();

app.listen(config.port, async () => {
  try {
    await moderationQueue.isReady();
    logger.info("Redis queue connection established", { concurrency: config.queueConcurrency });
  } catch (error) {
    logger.error("Redis queue connection failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  logger.info(`Server running on port ${config.port} [${config.nodeEnv}]`);
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received — shutting down gracefully");
  await moderationQueue.pause(true);
  await moderationQueue.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received — shutting down gracefully");
  await moderationQueue.pause(true);
  await moderationQueue.close();
  process.exit(0);
});
