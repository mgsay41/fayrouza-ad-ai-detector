import { Router, Request, Response } from "express";
import { getQueueStats } from "../services/queue/moderationQueue";

const router = Router();

router.get("/health", async (_req: Request, res: Response) => {
  let queue: Record<string, number> | undefined;

  try {
    queue = await getQueueStats();
  } catch {
    // Redis may not be available
  }

  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    queue,
  });
});

export default router;
