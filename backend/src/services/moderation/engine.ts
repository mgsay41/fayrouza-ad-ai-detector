import { analyzeText } from "../gemini/textAnalysis";
import { analyzeImage } from "../gemini/imageAnalysis";
import { score } from "./scoring";
import { ModerationRequest, ModerationResult } from "./types";
import logger from "../../utils/logger";
import { writeAudit } from "../audit/logger";

export async function runModeration(
  request: ModerationRequest
): Promise<ModerationResult> {
  const startTime = Date.now();

  logger.info("Starting moderation", {
    ad_id: request.ad_id,
    title: request.title,
  });

  const [textResult, imageResult] = await Promise.all([
    analyzeText({
      title: request.title,
      description: request.description,
      price: request.price,
      category: request.category,
    }),
    request.imageUrl
      ? analyzeImage({
          imageUrl: request.imageUrl,
          price: request.price,
          category: request.category,
        })
      : Promise.resolve(null),
  ]);

  const scoringOutput = score({ textResult, imageResult });

  const processingMs = Date.now() - startTime;

  logger.info("Moderation complete", {
    ad_id: request.ad_id,
    decision: scoringOutput.decision,
    final_score: scoringOutput.final_score,
    violations: scoringOutput.violations.length,
    processing_ms: processingMs,
  });

  writeAudit({
    ad_id: request.ad_id,
    decision: scoringOutput.decision,
    confidence_score: scoringOutput.final_score,
    violations: scoringOutput.violations,
    processing_ms: processingMs,
    source: "gemini_analysis",
    created_at: new Date().toISOString(),
  });

  return {
    decision: scoringOutput.decision,
    fayrouza_status: scoringOutput.fayrouza_status,
    final_score: scoringOutput.final_score,
    reasoning: scoringOutput.reasoning,
    text_analysis: textResult,
    image_analysis: imageResult,
    violations: scoringOutput.violations,
    concerns: scoringOutput.concerns,
    processed_at: new Date().toISOString(),
  };
}
