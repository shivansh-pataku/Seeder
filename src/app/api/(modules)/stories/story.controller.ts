// src/app/api/(modules)/stories/story.controller.ts
import { getCurrentUser } from '@/app/lib/getCurrentUser';
import { StoryService } from './story.service';
import { createStorySchema, updateStorySchema } from './story.schema';
import { handleSuccessResponse, handleErrorResponse } from '@/app/lib/errorHandler';

export class StoryController {
  /**
   * GET /api/stories - List published stories for feed, or user's own stories if query ?my=true
   */
  static async list(request: Request) {
    try {
      const url = new URL(request.url);
      const isMyStories = url.searchParams.get('my') === 'true';

      if (isMyStories) {
        const user = await getCurrentUser();
        if (!user || !user.id) {
          return handleErrorResponse({ message: 'Authentication required to view your stories', status: 401 });
        }
        const stories = await StoryService.getUserStories(user.id);
        return handleSuccessResponse({ stories }, 'Fetched user stories');
      }

      const stories = await StoryService.getPublishedStories();
      return handleSuccessResponse({ stories }, 'Fetched published stories');
    } catch (error) {
      return handleErrorResponse(error);
    }
  }

  /**
   * POST /api/stories - Create new story
   */
  static async create(request: Request) {
    try {
      const user = await getCurrentUser();
      if (!user || !user.id) {
        return handleErrorResponse({ message: 'Authentication required to create a story', status: 401 });
      }

      const body = await request.json();
      const validatedInput = createStorySchema.parse(body);

      const story = await StoryService.createStory(user.id, validatedInput);
      return handleSuccessResponse({ story }, 'Story created successfully', 201);
    } catch (error) {
      return handleErrorResponse(error);
    }
  }

  /**
   * GET /api/stories/[id] - Get story by ID
   */
  static async getById(request: Request, id: string | number) {
    try {
      const user = await getCurrentUser();
      const story = await StoryService.getStoryById(id, user?.id || null);

      if (!story) {
        return handleErrorResponse({ message: 'Story not found or private', status: 404 });
      }

      return handleSuccessResponse({ story }, 'Story retrieved successfully');
    } catch (error) {
      return handleErrorResponse(error);
    }
  }

  /**
   * PUT /api/stories/[id] or PUT /api/stories - Update story
   */
  static async update(request: Request, idParam?: string | number) {
    try {
      const user = await getCurrentUser();
      if (!user || !user.id) {
        return handleErrorResponse({ message: 'Authentication required to update stories', status: 401 });
      }

      const body = await request.json();
      const payload = { ...body, id: idParam || body.id };
      const validatedInput = updateStorySchema.parse(payload);

      const updated = await StoryService.updateStory(user.id, validatedInput);
      if (!updated) {
        return handleErrorResponse({ message: 'Story not found or you do not have permission to edit it', status: 404 });
      }

      const updatedStory = await StoryService.getStoryById(validatedInput.id, user.id);
      return handleSuccessResponse({ story: updatedStory }, 'Story updated successfully');
    } catch (error) {
      return handleErrorResponse(error);
    }
  }

  /**
   * DELETE /api/stories/[id] or DELETE /api/stories
   */
  static async delete(request: Request, idParam?: string | number) {
    try {
      const user = await getCurrentUser();
      if (!user || !user.id) {
        return handleErrorResponse({ message: 'Authentication required', status: 401 });
      }

      let storyId = idParam;
      if (!storyId) {
        const body = await request.json().catch(() => ({}));
        storyId = body.id;
      }

      if (!storyId) {
        return handleErrorResponse({ message: 'Story ID is required', status: 400 });
      }

      const deleted = await StoryService.deleteStory(user.id, storyId);
      if (!deleted) {
        return handleErrorResponse({ message: 'Story not found or unauthorized', status: 404 });
      }

      return handleSuccessResponse({ id: storyId }, 'Story deleted successfully');
    } catch (error) {
      return handleErrorResponse(error);
    }
  }
}
