import { z } from "zod";

export const moderationRequestSchema = z
  .object({
    ad_id: z.number().int().positive(),
    ad_title: z.string().min(1).max(500),
    ad_description: z.string().min(1).max(5000),
    ad_price: z.number().min(0),
    ad_category: z.string().min(1).max(100),
    image: z.string().url().optional(),
    user_id: z.number().int().positive().optional(),
    callback_url: z.string().url().optional(),
  })
  .transform((data) => ({
    ad_id: data.ad_id,
    title: data.ad_title,
    description: data.ad_description,
    price: data.ad_price,
    category: data.ad_category,
    imageUrl: data.image,
    user_id: data.user_id,
    callback_url: data.callback_url,
  }));

export type ModerationRequest = z.infer<typeof moderationRequestSchema>;
