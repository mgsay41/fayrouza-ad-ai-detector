import { z } from "zod";

export const adminOverrideSchema = z.object({
  ad_id: z.number().int().positive(),
  decision: z.enum(["AUTO_APPROVED", "NEEDS_REVIEW", "AUTO_REJECTED"]),
  reason: z.string().min(1).max(1000),
  reviewer_id: z.number().int().positive(),
});

export type AdminOverrideRequest = z.infer<typeof adminOverrideSchema>;
