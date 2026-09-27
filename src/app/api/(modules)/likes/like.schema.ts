// src/app/api/(modules)/likes/like.schema.ts
import { z } from 'zod';

export const likeActionSchema = z.object({
  entityId: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  entityType: z.string().default('story'),
});

export type LikeActionInput = z.infer<typeof likeActionSchema>;
