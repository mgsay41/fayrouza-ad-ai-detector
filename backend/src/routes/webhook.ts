import { Router, Request, Response, NextFunction } from "express";
import { runModeration } from "../services/moderation/engine";
import { validate } from "../middleware/validate";
import { webhookRequestSchema } from "../schemas/webhookRequest";
import { webhookLimiter } from "../middleware/rateLimiter";
import { authenticate } from "../middleware/auth";
import logger from "../utils/logger";

const router = Router();

router.post(
  "/webhook/moderate",
  webhookLimiter,
  authenticate("webhook"),
  validate(webhookRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, description, price, category, imageUrl, ad_id } = req.body;

      logger.info("Webhook moderation request received", {
        title,
        category,
        ad_id,
        hasImage: !!imageUrl,
      });

      const result = await runModeration({
        ad_id,
        title,
        description,
        price,
        category,
        imageUrl,
      });

      res.json({
        success: true,
        data: {
          decision: result.decision,
          confidence_score: result.final_score,
          reasoning: result.reasoning,
          processed_at: result.processed_at,
          details: {
            text_decision: result.text_analysis?.text_decision ?? null,
            text_confidence: result.text_analysis?.text_confidence ?? null,
            text_reasoning: result.text_analysis?.text_reasoning ?? null,
            text_violations: result.text_analysis?.text_violations ?? [],
            text_concerns: result.text_analysis?.text_concerns ?? [],
            image_decision: result.image_analysis?.image_decision ?? null,
            image_confidence: result.image_analysis?.image_confidence ?? null,
            image_reasoning: result.image_analysis?.image_reasoning ?? null,
            image_violations: result.image_analysis?.image_violations ?? [],
            image_concerns: result.image_analysis?.image_concerns ?? [],
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
