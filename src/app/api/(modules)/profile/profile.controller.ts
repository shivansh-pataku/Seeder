// src/app/api/(modules)/profile/profile.controller.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/lib/getCurrentUser';
import { ProfileService } from './profile.service';
import { updateProfileSchema } from './profile.schema';
import { handleErrorResponse } from '@/app/lib/errorHandler';

export class ProfileController {
  /**
   * GET /api/profile/[username] - Fetch user profile & published stories
   */
  static async get(request: Request, username: string) {
    try {
      if (!username) {
        return handleErrorResponse({ message: 'Username is required', status: 400 });
      }

      const currentUser = await getCurrentUser();
      const profile = await ProfileService.getProfileByUsername(
        username,
        currentUser?.id || null,
        currentUser?.username || null
      );

      if (!profile) {
        return handleErrorResponse({ message: 'Profile not found', status: 404 });
      }

      // Supports both standardized { data: { profile } } and legacy { profile }
      return NextResponse.json({
        success: true,
        message: 'Profile fetched successfully',
        data: { profile },
        profile,
      });
    } catch (error) {
      return handleErrorResponse(error);
    }
  }

  /**
   * PATCH /api/profile/[username] - Update user profile
   */
  static async update(request: Request, username: string) {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser || !currentUser.id) {
        return handleErrorResponse({ message: 'Authentication required', status: 401 });
      }

      // Authorization check: User can only update their own profile
      if (currentUser.username.toLowerCase() !== username.toLowerCase()) {
        return handleErrorResponse({ message: 'You are not authorized to update this profile', status: 403 });
      }

      const body = await request.json();
      const validatedInput = updateProfileSchema.parse(body);

      const result = await ProfileService.updateProfile(currentUser.id, validatedInput);
      return NextResponse.json({
        success: true,
        message: result.message || 'Profile updated successfully',
        data: { profile: result.profile },
        profile: result.profile,
      });
    } catch (error) {
      return handleErrorResponse(error);
    }
  }
}
