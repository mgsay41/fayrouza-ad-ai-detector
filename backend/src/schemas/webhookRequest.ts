import { z } from "zod";

export const webhookRequestSchema = z
  .object({
    ad_id: z.number().int().positive().optional(),
    title: z.string().min(1).max(500).optional(),
    ad_title: z.string().min(1).max(500).optional(),
    description: z.string().min(1).max(5000).optional(),
    ad_description: z.string().min(1).max(5000).optional(),
    price: z.number().min(0).optional(),
    ad_price: z.number().min(0).optional(),
    category: z.string().min(1).max(100).optional(),
    ad_category: z.string().min(1).max(100).optional(),
    imageUrl: z.string().url().optional(),
    image: z.string().url().optional(),
  })
  .transform((data) => ({
    ad_id: data.ad_id,
    title: data.title ?? data.ad_title ?? "",
    description: data.description ?? data.ad_description ?? "",
    price: data.price ?? data.ad_price ?? 0,
    category: data.category ?? data.ad_category ?? "",
    imageUrl: data.imageUrl ?? data.image,
  }))
  .refine((data) => data.title.length > 0, {
    message: "Either 'title' or 'ad_title' is required",
    path: ["title"],
  })
  .refine((data) => data.description.length > 0, {
    message: "Either 'description' or 'ad_description' is required",
    path: ["description"],
  })
  .refine((data) => data.category.length > 0, {
    message: "Either 'category' or 'ad_category' is required",
    path: ["category"],
  });

export type WebhookRequest = z.infer<typeof webhookRequestSchema>;
