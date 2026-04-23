import { Router } from "express";
import healthRouter from "./health";
import webhookRouter from "./webhook";
import moderationRouter from "./moderation";
import adminRouter from "./admin";

const router = Router();

router.use(healthRouter);
router.use(webhookRouter);
router.use(moderationRouter);
router.use(adminRouter);

export default router;
