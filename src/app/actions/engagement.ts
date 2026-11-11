'use server';

import { getCurrentUser } from '@/lib/getCurrentUser';
import { LikeService } from '@/app/api/(modules)/likes/like.service';
import { SavedItemService } from '@/app/api/(modules)/saved-items/savedItem.service';
import { FolderService } from '@/app/api/(modules)/folders/folder.service';
import { revalidatePath } from 'next/cache';

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Toggle like status on a story with automatic cache revalidation
 */
export async function toggleStoryLikeAction(
  storyId: number | string
): Promise<ActionResponse<{ isLiked: boolean }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: 'Please sign in to like stories' };
    }

    const numId = Number(storyId);
    if (isNaN(numId)) {
      return { success: false, error: 'Invalid story ID' };
    }

    const alreadyLiked = await LikeService.hasUserLiked(user.id, numId, 'story');

    if (alreadyLiked) {
      await LikeService.unlikeItem(user.id, numId, 'story');
    } else {
      await LikeService.likeItem(user.id, numId, 'story');
    }

    revalidatePath(`/read/${numId}`);
    revalidatePath('/');

    return { success: true, data: { isLiked: !alreadyLiked } };
  } catch (error) {
    console.error('Server Action toggleStoryLikeAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update like status',
    };
  }
}

/**
 * Server Action: Toggle save/bookmark status on a story
 */
export async function toggleStorySaveAction(
  storyId: number | string,
  folderId?: number | null
): Promise<ActionResponse<{ isSaved: boolean }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: 'Please sign in to save stories' };
    }

    const numId = Number(storyId);
    if (isNaN(numId)) {
      return { success: false, error: 'Invalid story ID' };
    }

    const alreadySaved = await SavedItemService.isStorySaved(user.id, numId);

    if (alreadySaved) {
      await SavedItemService.unsaveItem(user.id, numId, 'story', folderId);
    } else {
      await SavedItemService.saveItem(user.id, {
        entityId: numId,
        entityType: 'story',
        folderId: folderId ?? null,
      });
    }

    revalidatePath(`/read/${numId}`);
    revalidatePath('/library');

    return { success: true, data: { isSaved: !alreadySaved } };
  } catch (error) {
    console.error('Server Action toggleStorySaveAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update saved status',
    };
  }
}

/**
 * Server Action: Get folders belonging to current user
 */
export async function getUserFoldersAction(): Promise<ActionResponse<{ folders: any[] }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: 'Unauthorized', data: { folders: [] } };
    }

    const folders = await FolderService.getUserFolders(user.id);
    return { success: true, data: { folders: folders as any[] } };
  } catch (error) {
    console.error('Server Action getUserFoldersAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch folders',
      data: { folders: [] },
    };
  }
}

/**
 * Server Action: Get the saved folders for a given story
 */
export async function getStorySavedFoldersAction(
  storyId: number | string
): Promise<ActionResponse<{ isSaved: boolean; savedFolderIds: Array<number | 'root'> }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, data: { isSaved: false, savedFolderIds: [] } };
    }

    const numId = Number(storyId);
    if (isNaN(numId)) {
      return { success: false, error: 'Invalid story ID', data: { isSaved: false, savedFolderIds: [] } };
    }

    const savedFolderIds = await SavedItemService.getStorySavedFolders(user.id, numId);
    return {
      success: true,
      data: {
        isSaved: savedFolderIds.length > 0,
        savedFolderIds,
      },
    };
  } catch (error) {
    console.error('Server Action getStorySavedFoldersAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch saved state',
      data: { isSaved: false, savedFolderIds: [] },
    };
  }
}

/**
 * Server Action: Create a folder
 */
export async function createFolderAction(
  name: string,
  parentId?: number | null
): Promise<ActionResponse<{ folder: any }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!name || !name.trim()) {
      return { success: false, error: 'Folder name is required' };
    }

    const folder = await FolderService.createFolder(user.id, {
      name: name.trim(),
      parentId: parentId || null,
    });

    revalidatePath('/library');
    return { success: true, data: { folder } };
  } catch (error) {
    console.error('Server Action createFolderAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create folder',
    };
  }
}

/**
 * Server Action: Save story to a specific folder
 */
export async function saveStoryToFolderAction(
  storyId: number | string,
  folderId: number | null
): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const numId = Number(storyId);
    await SavedItemService.saveItem(user.id, {
      entityId: numId,
      entityType: 'story',
      folderId: folderId,
    });

    revalidatePath(`/read/${numId}`);
    revalidatePath('/library');
    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('Server Action saveStoryToFolderAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save to folder',
    };
  }
}

/**
 * Server Action: Unsave story from a specific folder
 */
export async function unsaveStoryFromFolderAction(
  storyId: number | string,
  folderId: number | null
): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const numId = Number(storyId);
    await SavedItemService.unsaveItem(user.id, numId, 'story', folderId);

    revalidatePath(`/read/${numId}`);
    revalidatePath('/library');
    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('Server Action unsaveStoryFromFolderAction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unsave from folder',
    };
  }
}
