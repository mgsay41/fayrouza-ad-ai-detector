import fayrouzaClient from "./client";
import { ModerationResult } from "../moderation/types";
import { mapDecisionToStatus } from "../../utils/mapDecision";
import { retry } from "../../utils/retry";
import logger from "../../utils/logger";
import { isSafeUrl } from "../../utils/ssrf";

export async function updateAdStatus(
  adId: number,
  status: number
): Promise<void> {
  await retry(
    async () => {
      await fayrouzaClient.post(`/ads/update/${adId}`, null, {
        params: { status },
      });
    },
    {
      shouldRetry: (error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        if (!status) return false;
        return status === 429 || status === 503 || status >= 500;
      },
    }
  );
}

export async function postCallback(
  callbackUrl: string,
  result: ModerationResult
): Promise<void> {
  if (!isSafeUrl(callbackUrl)) {
    logger.error("Callback URL blocked — private/internal address", {
      callback_url: callbackUrl,
    });
    return;
  }

  try {
    await retry(
      async () => {
        await fayrouzaClient.post(callbackUrl, result);
      },
      {
        shouldRetry: (error: unknown) => {
          const status = (error as { response?: { status?: number } })?.response
            ?.status;
          if (!status) return false;
          return status === 429 || status === 503 || status >= 500;
        },
      }
    );
  } catch (error) {
    logger.error("Callback failed after all retries — manual recovery needed", {
      callback_url: callbackUrl,
      decision: result.decision,
      fayrouza_status: result.fayrouza_status,
      final_score: result.final_score,
      violations: result.violations,
      reasoning: result.reasoning,
      processed_at: result.processed_at,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
