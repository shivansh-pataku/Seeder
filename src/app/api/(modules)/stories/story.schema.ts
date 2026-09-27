// src/app/api/(modules)/stories/story.schema.ts
import { z } from 'zod';

export const createStorySchema = z.object({
  title: z
    .string()
    .max(255, 'Title must not exceed 255 characters')
    .optional()
    .transform((val) => val?.trim() || 'Untitled Story'),
  description: z.string().default(''),
  story_type: z.enum(['article', 'post', 'essay', 'story']).default('article'),
  status: z
    .union([z.boolean(), z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (typeof val === 'boolean') return val ? 1 : 0;
      if (typeof val === 'number') return val === 1 ? 1 : 0;
      if (typeof val === 'string') return val === 'published' || val === '1' ? 1 : 0;
      return 0;
    }),
});

export const updateStorySchema = z.object({
  id: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  title: z
    .string()
    .max(255, 'Title must not exceed 255 characters')
    .optional(),
  description: z.string().optional(),
  story_type: z.enum(['article', 'post', 'essay', 'story']).optional(),
  status: z
    .union([z.boolean(), z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (typeof val === 'boolean') return val ? 1 : 0;
      if (typeof val === 'number') return val === 1 ? 1 : 0;
      if (typeof val === 'string') return val === 'published' || val === '1' ? 1 : 0;
      return 0;
    }),
});

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;

export interface StoryAuthor {
  id: number | null;
  username: string;
  name: string;
  bio?: string;
  location?: string;
  gender?: string;
  isPrivate?: boolean;
}

export interface StoryDTO {
  id: number;
  title: string;
  snippet: string;
  description?: string;
  story_type: string;
  status: boolean; // true = published, false = draft
  word_count: number;
  reading_time_minutes: number;
  likes_count: number;
  created_at: string;
  updated_at?: string;
  author?: StoryAuthor;
}
