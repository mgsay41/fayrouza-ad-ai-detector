import { GeminiTextResult, GeminiImageResult } from "../gemini/types";
import {
  ModerationDecision,
  FayrouzaStatus,
} from "./types";
import { config } from "../../config";

export interface ScoringInput {
  textResult: GeminiTextResult | null;
  imageResult: GeminiImageResult | null;
}

export interface ScoringOutput {
  decision: ModerationDecision;
  fayrouza_status: FayrouzaStatus;
  final_score: number;
  reasoning: string;
  violations: string[];
  concerns: string[];
}

function computeAverageConfidence(
  textResult: GeminiTextResult | null,
  imageResult: GeminiImageResult | null
): number {
  if (textResult && imageResult) {
    return Math.round(
      (textResult.text_confidence + imageResult.image_confidence) / 2
    );
  }
  if (textResult) {
    return textResult.text_confidence;
  }
  if (imageResult) {
    return imageResult.image_confidence;
  }
  return 0;
}

function hasReject(
  textResult: GeminiTextResult | null,
  imageResult: GeminiImageResult | null
): boolean {
  return (
    textResult?.text_decision === "reject" ||
    imageResult?.image_decision === "reject"
  );
}

function hasReview(
  textResult: GeminiTextResult | null,
  imageResult: GeminiImageResult | null
): boolean {
  return (
    textResult?.text_decision === "review" ||
    imageResult?.image_decision === "review"
  );
}

function buildReasoning(
  textResult: GeminiTextResult | null,
  imageResult: GeminiImageResult | null
): string {
  const parts: string[] = [];

  if (textResult) {
    parts.push(
      "=== TEXT ANALYSIS ===",
      `Decision: ${textResult.text_decision}`,
      `Confidence: ${textResult.text_confidence}%`,
      textResult.text_reasoning
    );
    if (textResult.text_violations.length > 0) {
      parts.push(`Violations: ${textResult.text_violations.join(", ")}`);
    }
    if (textResult.text_concerns.length > 0) {
      parts.push(`Concerns: ${textResult.text_concerns.join(", ")}`);
    }
  }

  if (imageResult) {
    parts.push(
      "=== IMAGE ANALYSIS ===",
      `Decision: ${imageResult.image_decision}`,
      `Confidence: ${imageResult.image_confidence}%`,
      imageResult.image_reasoning
    );
    if (imageResult.image_violations.length > 0) {
      parts.push(`Violations: ${imageResult.image_violations.join(", ")}`);
    }
    if (imageResult.image_concerns.length > 0) {
      parts.push(`Concerns: ${imageResult.image_concerns.join(", ")}`);
    }
  }

  if (!textResult && !imageResult) {
    parts.push("No analysis results available.");
  }

  return parts.join("\n");
}

function collectViolations(
  textResult: GeminiTextResult | null,
  imageResult: GeminiImageResult | null
): string[] {
  const violations: string[] = [];
  if (textResult) {
    violations.push(...textResult.text_violations);
  }
  if (imageResult) {
    violations.push(...imageResult.image_violations);
  }
  return [...new Set(violations)];
}

function collectConcerns(
  textResult: GeminiTextResult | null,
  imageResult: GeminiImageResult | null
): string[] {
  const concerns: string[] = [];
  if (textResult) {
    concerns.push(...textResult.text_concerns);
  }
  if (imageResult) {
    concerns.push(...imageResult.image_concerns);
  }
  return [...new Set(concerns)];
}

export function score(
  input: ScoringInput,
  thresholds?: { autoApprove?: number; needsReview?: number }
): ScoringOutput {
  const { textResult, imageResult } = input;
  const autoApproveThreshold =
    thresholds?.autoApprove ?? config.scoreAutoApprove;
  const needsReviewThreshold =
    thresholds?.needsReview ?? config.scoreNeedsReview;

  const avgConfidence = computeAverageConfidence(textResult, imageResult);
  const rejected = hasReject(textResult, imageResult);
  const needsReview = hasReview(textResult, imageResult);

  let decision: ModerationDecision;
  let fayrouzaStatus: FayrouzaStatus;

  if (rejected) {
    decision = "AUTO_REJECTED";
    fayrouzaStatus = 4;
  } else if (needsReview) {
    // Gemini explicitly flagged content for human review — honour it regardless of confidence
    decision = "NEEDS_REVIEW";
    fayrouzaStatus = 3;
  } else if (avgConfidence >= autoApproveThreshold) {
    decision = "AUTO_APPROVED";
    fayrouzaStatus = 1;
  } else if (avgConfidence >= needsReviewThreshold) {
    decision = "NEEDS_REVIEW";
    fayrouzaStatus = 3;
  } else {
    decision = "AUTO_REJECTED";
    fayrouzaStatus = 4;
  }

  return {
    decision,
    fayrouza_status: fayrouzaStatus,
    final_score: avgConfidence,
    reasoning: buildReasoning(textResult, imageResult),
    violations: collectViolations(textResult, imageResult),
    concerns: collectConcerns(textResult, imageResult),
  };
}
