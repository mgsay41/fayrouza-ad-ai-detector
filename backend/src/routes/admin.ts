import { Router, Request, Response, NextFunction } from "express";
import { validate } from "../middleware/validate";
import { adminOverrideSchema } from "../schemas/adminOverrideRequest";
import { auditQuerySchema } from "../schemas/auditQueryRequest";
import { adminLimiter } from "../middleware/rateLimiter";
import { authenticate } from "../middleware/auth";
import { updateAdStatus } from "../services/fayrouza/adService";
import { mapDecisionToStatus } from "../utils/mapDecision";
import { writeAudit, queryAudit } from "../services/audit/logger";
import logger from "../utils/logger";

const router = Router();

router.post(
  "/api/admin/override",
  adminLimiter,
  authenticate("admin"),
  validate(adminOverrideSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ad_id, decision, reason, reviewer_id } = req.body;

      logger.info("Admin override requested", {
        ad_id,
        decision,
        reviewer_id,
      });

      const fayrouzaStatus = mapDecisionToStatus(decision);

      try {
        await updateAdStatus(ad_id, fayrouzaStatus);
      } catch (fayrouzaError) {
        logger.error("Failed to sync admin override to Fayrouza (override still recorded)", {
          ad_id,
          decision,
          error: fayrouzaError instanceof Error ? fayrouzaError.message : String(fayrouzaError),
        });
      }

      writeAudit({
        ad_id,
        decision,
        source: "admin_override",
        reason,
        reviewer_id,
        created_at: new Date().toISOString(),
      });

      logger.info("Admin override applied", {
        ad_id,
        decision,
        fayrouza_status: fayrouzaStatus,
      });

      res.json({
        success: true,
        data: {
          ad_id,
          decision,
          fayrouza_status: fayrouzaStatus,
          reason,
          reviewer_id,
          overridden_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/api/admin/audit",
  adminLimiter,
  authenticate("admin"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = auditQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        const errors = parsed.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: errors,
        });
        return;
      }

      const { ad_id, decision, limit, offset } = parsed.data;

      const entries = await queryAudit({ ad_id, decision, limit, offset });

      res.json({
        success: true,
        data: {
          entries,
          count: entries.length,
          limit,
          offset,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
