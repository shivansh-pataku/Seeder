// src/app/api/(modules)/saved-items/savedItem.schema.ts
import { z } from 'zod';

export const saveItemSchema = z.object({
  entityId: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  entityType: z.string().default('story'),
  folderId: z
    .union([z.number(), z.string()])
    .nullable()
    .optional()
    .transform((val) => (val ? Number(val) : null)),
});

export const unsaveItemSchema = z.object({
  entityId: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  entityType: z.string().default('story'),
  folderId: z
    .union([z.number(), z.string()])
    .nullable()
    .optional()
    .transform((val) => (val ? Number(val) : null)),
});

export type SaveItemInput = z.infer<typeof saveItemSchema>;
export type UnsaveItemInput = z.infer<typeof unsaveItemSchema>;
