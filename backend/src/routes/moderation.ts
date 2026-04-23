import { Router, Request, Response, NextFunction } from "express";
import { addModerationJob } from "../services/queue/moderationQueue";
import { validate } from "../middleware/validate";
import { moderationRequestSchema } from "../schemas/moderationRequest";
import { apiLimiter } from "../middleware/rateLimiter";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post(
  "/api/ads/moderate",
  apiLimiter,
  authenticate("internal"),
  validate(moderationRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const job = await addModerationJob(req.body);

      res.status(202).json({
        success: true,
        job_id: job.id,
        estimated_seconds: 15,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
