import { GeminiTextResult, GeminiImageResult } from "../gemini/types";

export type ModerationEngineRequest = {
  ad_id?: number;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
};

export type ModerationRequest = ModerationEngineRequest;

export type ModerationDecision =
  | "AUTO_APPROVED"
  | "AUTO_REJECTED"
  | "NEEDS_REVIEW";

export type FayrouzaStatus = 1 | 3 | 4;

export interface ModerationResult {
  decision: ModerationDecision;
  fayrouza_status: FayrouzaStatus;
  final_score: number;
  reasoning: string;
  text_analysis: GeminiTextResult | null;
  image_analysis: GeminiImageResult | null;
  violations: string[];
  concerns: string[];
  processed_at: string;
}
