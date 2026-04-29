import { Router } from "express";
import healthRouter from "./health";
import webhookRouter from "./webhook";
import moderationRouter from "./moderation";
import adminRouter from "./admin";
import v1Router from "./v1";

const router = Router();

router.use(healthRouter);
router.use(v1Router);
router.use(webhookRouter);
router.use(moderationRouter);
router.use(adminRouter);

export default router;
