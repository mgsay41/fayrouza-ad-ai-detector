import Queue from "bull";
import { config } from "../../config";
import { runModeration } from "../moderation/engine";
import { updateAdStatus, postCallback } from "../fayrouza/adService";
import { ModerationRequest } from "../../schemas/moderationRequest";
import logger from "../../utils/logger";

export const moderationQueue = new Queue<ModerationRequest>("moderation", {
  redis: {
    host: config.redisHost,
    port: config.redisPort,
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 200,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

moderationQueue.process(config.queueConcurrency, async (job) => {
  const { ad_id, title, description, price, category, imageUrl, callback_url } =
    job.data;

  logger.info("Processing moderation job", {
    job_id: job.id,
    ad_id,
    title,
  });

  let result;

  try {
    result = await runModeration({
      ad_id,
      title,
      description,
      price,
      category,
      imageUrl,
    });
  } catch (error) {
    logger.error("Moderation failed — leaving ad in needs_review status", {
      job_id: job.id,
      ad_id,
      error: error instanceof Error ? error.message : String(error),
    });

    try {
      await updateAdStatus(ad_id, 3);
    } catch (statusError) {
      logger.error("Failed to set ad to needs_review after moderation failure", {
        ad_id,
        error:
          statusError instanceof Error ? statusError.message : String(statusError),
      });
    }

    if (callback_url) {
      try {
        await postCallback(callback_url, {
          decision: "NEEDS_REVIEW",
          fayrouza_status: 3,
          final_score: 0,
          reasoning: `Moderation failed: ${error instanceof Error ? error.message : String(error)}`,
          text_analysis: null,
          image_analysis: null,
          violations: [],
          concerns: [],
          processed_at: new Date().toISOString(),
        });
      } catch (_callbackError) {
        // postCallback already logs internally
      }
    }

    throw error;
  }

  try {
    await updateAdStatus(ad_id, result.fayrouza_status);
    logger.info("Ad status updated in Fayrouza", {
      job_id: job.id,
      ad_id,
      status: result.fayrouza_status,
      decision: result.decision,
    });
  } catch (error) {
    logger.error("Failed to update ad status in Fayrouza", {
      job_id: job.id,
      ad_id,
      decision: result.decision,
      fayrouza_status: result.fayrouza_status,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  if (callback_url) {
    await postCallback(callback_url, result);
  }

  return result;
});

moderationQueue.on("completed", (job, result) => {
  logger.info("Moderation job completed", {
    job_id: job.id,
    ad_id: job.data.ad_id,
    decision: result.decision,
    final_score: result.final_score,
  });
});

moderationQueue.on("failed", (job, error) => {
  logger.error("Moderation job failed", {
    job_id: job?.id,
    ad_id: job?.data?.ad_id,
    error: error.message,
  });
});

moderationQueue.on("stalled", (jobId) => {
  logger.warn("Moderation job stalled", { job_id: jobId });
});

export function generateJobId(adId: number): string {
  return `mod_${adId}_${Date.now()}`;
}

export async function addModerationJob(
  data: ModerationRequest
): Promise<Queue.Job<ModerationRequest>> {
  const jobId = generateJobId(data.ad_id);

  const job = await moderationQueue.add(data, {
    jobId,
  });

  logger.info("Moderation job queued", {
    job_id: job.id,
    ad_id: data.ad_id,
    callback_url: data.callback_url,
  });

  return job;
}

export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    moderationQueue.getWaitingCount(),
    moderationQueue.getActiveCount(),
    moderationQueue.getCompletedCount(),
    moderationQueue.getFailedCount(),
    moderationQueue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}
