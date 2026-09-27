// src/app/api/(modules)/folders/folder.controller.ts
import { getCurrentUser } from '@/app/lib/getCurrentUser';
import { FolderService } from './folder.service';
import { createFolderSchema } from './folder.schema';
import { handleSuccessResponse, handleErrorResponse } from '@/app/lib/errorHandler';

export class FolderController {
  static async list() {
    try {
      const user = await getCurrentUser();
      if (!user || !user.id) {
        return handleErrorResponse({ message: 'Authentication required', status: 401 });
      }

      const folders = await FolderService.getUserFolders(user.id);
      return handleSuccessResponse({ folders }, 'Folders fetched successfully');
    } catch (error) {
      return handleErrorResponse(error);
    }
  }

  static async create(request: Request) {
    try {
      const user = await getCurrentUser();
      if (!user || !user.id) {
        return handleErrorResponse({ message: 'Authentication required', status: 401 });
      }

      const body = await request.json();
      const validatedInput = createFolderSchema.parse(body);

      const folder = await FolderService.createFolder(user.id, validatedInput);
      return handleSuccessResponse({ folder }, 'Folder created successfully', 201);
    } catch (error) {
      return handleErrorResponse(error);
    }
  }

  static async delete(request: Request, idParam?: string | number) {
    try {
      const user = await getCurrentUser();
      if (!user || !user.id) {
        return handleErrorResponse({ message: 'Authentication required', status: 401 });
      }

      const folderId = idParam;
      if (!folderId) {
        return handleErrorResponse({ message: 'Folder ID is required', status: 400 });
      }

      const deleted = await FolderService.deleteFolder(user.id, folderId);
      if (!deleted) {
        return handleErrorResponse({ message: 'Folder not found or unauthorized', status: 404 });
      }

      return handleSuccessResponse({ id: folderId }, 'Folder deleted successfully');
    } catch (error) {
      return handleErrorResponse(error);
    }
  }
}
