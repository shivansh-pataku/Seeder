// src/app/api/(modules)/profile/profile.schema.ts
import { z } from 'zod';

export const socialProfileItemSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  username: z.string().trim(),
});

export const updateProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Letters, numbers, dots, dashes, and underscores only')
    .optional(),
  name: z.string().trim().max(100).optional(),
  email: z.string().email('Invalid email address').optional(),
  bio: z.string().max(1000).optional().nullable(),
  location: z.string().max(150).optional().nullable(),
  dob: z.string().max(50).optional().nullable(),
  gender: z.string().max(50).optional().nullable(),
  socialProfiles: z.array(socialProfileItemSchema).optional(),
  is_private: z.union([z.boolean(), z.number()]).optional(),
  email_notifications: z.union([z.boolean(), z.number()]).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
