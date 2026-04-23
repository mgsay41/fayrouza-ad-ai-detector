export interface GeminiTextResult {
  text_decision: "approve" | "reject" | "review";
  text_confidence: number;
  text_reasoning: string;
  text_violations: string[];
  text_concerns: string[];
}

export interface GeminiImageResult {
  image_decision: "approve" | "reject" | "review";
  image_confidence: number;
  image_reasoning: string;
  image_violations: string[];
  image_concerns: string[];
}
