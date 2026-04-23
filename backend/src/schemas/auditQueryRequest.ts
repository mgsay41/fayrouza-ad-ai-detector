import { z } from "zod";

export const auditQuerySchema = z.object({
  ad_id: z.coerce.number().int().positive().optional(),
  decision: z.enum(["AUTO_APPROVED", "NEEDS_REVIEW", "AUTO_REJECTED"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type AuditQueryRequest = z.infer<typeof auditQuerySchema>;
