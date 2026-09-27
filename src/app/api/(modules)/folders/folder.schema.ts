// src/app/api/(modules)/folders/folder.schema.ts
import { z } from 'zod';

export const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100, 'Folder name is too long'),
  parentId: z.union([z.number(), z.string()]).nullable().optional().transform((val) => val ? Number(val) : null),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(100, 'Folder name is too long'),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
