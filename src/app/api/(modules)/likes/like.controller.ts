// src/app/api/(modules)/likes/like.controller.ts
import { getCurrentUser } from '@/app/lib/getCurrentUser';
import { LikeService } from './like.service';
import { likeActionSchema } from './like.schema';
import { handleSuccessResponse, handleErrorResponse } from '@/app/lib/errorHandler';

export class LikeController {
  /**
   * POST /api/likes - Like an entity (or toggle)
   */
  static async like(request: Request) {
    try {
      const user = await getCurrentUser();
      if (!user || !user.id) {
        return handleErrorResponse({ message: 'Please sign in to like stories', status: 401 });
      }

      const body = await request.json();
      const { entityId, entityType } = likeActionSchema.parse(body);

      const result = await LikeService.likeItem(user.id, entityId, entityType);
      return handleSuccessResponse(result, 'Like recorded successfully');
    } catch (error) {
      return handleErrorResponse(error);
    }
  }

  /**
   * DELETE /api/likes - Unlike an entity
   */
  static async unlike(request: Request) {
    try {
      const user = await getCurrentUser();
      if (!user || !user.id) {
        return handleErrorResponse({ message: 'Authentication required', status: 401 });
      }

      const body = await request.json();
      const { entityId, entityType } = likeActionSchema.parse(body);

      const result = await LikeService.unlikeItem(user.id, entityId, entityType);
      return handleSuccessResponse(result, 'Like removed successfully');
    } catch (error) {
      return handleErrorResponse(error);
    }
  }

  /**
   * GET /api/likes - Check if liked, or list user's liked stories
   */
  static async get(request: Request) {
    try {
      const user = await getCurrentUser();
      if (!user || !user.id) {
        return handleErrorResponse({ message: 'Authentication required', status: 401 });
      }

      const url = new URL(request.url);
      const entityId = url.searchParams.get('entityId');
      const entityType = url.searchParams.get('entityType') || 'story';

      if (entityId) {
        const hasLiked = await LikeService.hasUserLiked(user.id, Number(entityId), entityType);
        return handleSuccessResponse({ hasLiked }, 'Checked like status');
      }

      const likedStories = await LikeService.getUserLikedStories(user.id);
      return handleSuccessResponse({ likedStories }, 'Fetched user liked stories');
    } catch (error) {
      return handleErrorResponse(error);
    }
  }
}
