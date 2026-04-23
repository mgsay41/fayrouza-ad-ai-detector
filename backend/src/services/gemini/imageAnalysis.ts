import { getModel } from "./client";
import { GeminiImageResult } from "./types";
import { parseGeminiJson } from "../../utils/parseGeminiJson";
import { retry } from "../../utils/retry";
import { GoogleGenerativeAIFetchError } from "@google/generative-ai";
import { config } from "../../config";
import logger from "../../utils/logger";
import { isSafeUrl } from "../../utils/ssrf";

const IMAGE_PROMPT = `You are a visual content moderator for Fayrouza, an Islamic marketplace operating in Egypt and Saudi Arabia. Analyze ONLY the image provided. You will NOT see the text description - another AI is analyzing that separately.

CONTEXT (for reference only):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Category: {{CATEGORY}}
Price: {{PRICE}} {{CURRENCY}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REJECTION CRITERIA - Flag as REJECT if image clearly shows:

1. HARAM PRODUCTS VISIBLE:
   - Alcohol bottles, cans, or containers (beer, wine, spirits) — including Gulf brands like شنكس, سميكم, بارون, and Egyptian brands like ستلايت, أيبردرافت
   - Pork meat or pork product packaging
   - Casino equipment, poker tables, gambling machines
   - Obvious haram religious symbols or idols

2. WEAPONS & DANGEROUS ITEMS VISIBLE:
   - Firearms, guns, rifles, pistols
   - Ammunition, bullets, magazines
   - Combat knives, tactical weapons (kitchen knives in kitchen context = OK)
   - Explosives, grenades, fireworks

3. DRUGS VISIBLE:
   - Illegal drugs or substances
   - Pills/powders in non-pharmaceutical packaging
   - Drug paraphernalia (bongs, pipes for smoking drugs)

4. ADULT/SEXUAL CONTENT VISIBLE:
   - Sexual products or adult toys
   - Provocative or sexually explicit imagery
   - Nudity or inappropriate exposure
   - Lingerie or undergarments marketed provocatively

5. CLEAR VIOLATIONS:
   - Obvious counterfeit products with fake logos
   - Stolen goods with identifying marks
   - Items clearly violating Islamic principles

REVIEW CRITERIA - Flag as REVIEW if:
   - Image is too blurry or unclear to verify product
   - Quality is so poor you cannot confirm what it shows
   - Medicine bottles or pharmaceutical products (need verification)
   - Suspicious packaging that could contain prohibited items
   - Ambiguous items that could be misused
   - Product doesn't match the expected category
   - Multiple items where some might be problematic
   - Lighting is too dark to see clearly

APPROVE CRITERIA - Flag as APPROVE if image clearly shows:
   - Clean, legitimate products in appropriate packaging
   - Standard marketplace items (electronics, clothing, furniture)
   - Food items that are clearly halal
   - Properly packaged goods with visible labeling
   - Items in their original, sealed packaging

IMPORTANT RULES:
- Only flag what you can CLEARLY see in the image
- Do not make assumptions about unlabeled containers or bottles
- Kitchen/cooking contexts with knives or cooking tools are OK
- Traditional clothing and modest fashion are OK
- If image is unclear or ambiguous, flag for REVIEW not REJECT
- Consider both Egyptian and Saudi/Gulf market contexts
- Saudi-specific: stricter enforcement, flag borderline items as REVIEW
- Decorative bottles, perfume bottles (عود, بخور), and food containers without labels are OK

RESPOND WITH THIS EXACT JSON FORMAT (no extra text before or after):
\`\`\`json
{
  "image_decision": "approve|reject|review",
  "image_confidence": 85,
  "image_reasoning": "Clear explanation of what you see and your decision...",
  "image_violations": ["violation1", "violation2"],
  "image_concerns": ["concern1"]
}
\`\`\`

- image_confidence: 0-100 (how confident you are in your decision)
- image_violations: array of specific violations found (empty if none)
- image_concerns: array of concerns that warrant human attention (empty if none)`;

interface ImageAnalysisInput {
  imageUrl: string;
  price: number;
  category: string;
}

async function fetchImageAsBase64(
  imageUrl: string
): Promise<{ mimeType: string; data: string } | null> {
  if (!isSafeUrl(imageUrl)) {
    logger.warn("Image URL blocked — private/internal address", { imageUrl });
    return null;
  }

  try {
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });

    if (!response.ok) {
      logger.warn(`Image fetch failed: ${response.status} ${response.statusText}`, {
        imageUrl,
      });
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return { mimeType: contentType, data: base64 };
  } catch (error) {
    logger.warn("Image fetch error", {
      imageUrl,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function analyzeImage(
  input: ImageAnalysisInput
): Promise<GeminiImageResult | null> {
  if (!input.imageUrl) {
    logger.debug("No image URL provided, skipping image analysis");
    return null;
  }

  logger.debug("Starting image analysis", { imageUrl: input.imageUrl });

  const imageData = await fetchImageAsBase64(input.imageUrl);
  if (!imageData) {
    logger.warn("Could not fetch image, skipping image analysis");
    return null;
  }

  const prompt = IMAGE_PROMPT
    .replace("{{CATEGORY}}", input.category)
    .replace("{{PRICE}}", String(input.price))
    .replace("{{CURRENCY}}", config.marketplaceCurrency);

  const result = await retry(
    async () => {
      const model = getModel();
      const response = await model.generateContent([
        { inlineData: { mimeType: imageData.mimeType, data: imageData.data } },
        { text: prompt },
      ]);
      const text = response.response.text();
      return parseGeminiJson<GeminiImageResult>(text);
    },
    {
      shouldRetry: (error: unknown) => {
        if (error instanceof GoogleGenerativeAIFetchError) {
          return error.status === 429 || error.status === 503;
        }
        return false;
      },
    }
  );

  logger.info("Image analysis complete", {
    decision: result.image_decision,
    confidence: result.image_confidence,
    violations: result.image_violations.length,
  });

  return result;
}
