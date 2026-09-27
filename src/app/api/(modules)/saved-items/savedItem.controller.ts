// src/app/api/(modules)/saved-items/savedItem.controller.ts
import { getCurrentUser } from '@/app/lib/getCurrentUser';
import { SavedItemService } from './savedItem.service';
import { saveItemSchema, unsaveItemSchema } from './savedItem.schema';
import { handleSuccessResponse, handleErrorResponse } from '@/app/lib/errorHandler';

export class SavedItemController {
  static async save(request: Request) {
    try {
      const user = await getCurrentUser();
      if (!user || !user.id) {
        return handleErrorResponse({ message: 'Please sign in to save stories', status: 401 });
      }

      const body = await request.json();
      const validatedInput = saveItemSchema.parse(body);

      const result = await SavedItemService.saveItem(user.id, validatedInput);
      return handleSuccessResponse(result, result.message, 201);
    } catch (error) {
      return handleErrorResponse(error);
    }
  }

  static async unsave(request: Request) {
    try {
      const user = await getCurrentUser();
      if (!user || !user.id) {
        return handleErrorResponse({ message: 'Authentication required', status: 401 });
      }

      const body = await request.json();
      const validatedInput = unsaveItemSchema.parse(body);

      const result = await SavedItemService.unsaveItem(
        user.id,
        validatedInput.entityId,
        validatedInput.entityType,
        validatedInput.folderId
      );

      return handleSuccessResponse(result, result.message);
    } catch (error) {
      return handleErrorResponse(error);
    }
  }

  static async get(request: Request) {
    try {
      const user = await getCurrentUser();
      if (!user || !user.id) {
        return handleErrorResponse({ message: 'Authentication required', status: 401 });
      }

      const url = new URL(request.url);
      const storyId = url.searchParams.get('storyId');
      const folderIdParam = url.searchParams.get('folderId');

      if (storyId) {
        const isSaved = await SavedItemService.isStorySaved(user.id, Number(storyId));
        return handleSuccessResponse({ isSaved }, 'Checked saved status');
      }

      const folderId = folderIdParam === 'root' ? null : folderIdParam ? Number(folderIdParam) : undefined;
      const savedStories = await SavedItemService.getUserSavedStories(user.id, folderId);
      return handleSuccessResponse({ savedStories }, 'Fetched saved stories');
    } catch (error) {
      return handleErrorResponse(error);
    }
  }
}
