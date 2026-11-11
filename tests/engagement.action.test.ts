import { describe, it, expect, vi } from 'vitest';
import {
  toggleStoryLikeAction,
  toggleStorySaveAction,
  getUserFoldersAction,
  getStorySavedFoldersAction,
  createFolderAction,
  saveStoryToFolderAction,
  unsaveStoryFromFolderAction,
} from '@/app/actions/engagement';

// Mock getCurrentUser to simulate an unauthenticated request
vi.mock('@/lib/getCurrentUser', () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
}));

// Mock next/cache revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Engagement Server Actions', () => {
  it('should return an error when an unauthenticated visitor tries to like a story', async () => {
    const result = await toggleStoryLikeAction(123);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Please sign in to like stories');
  });

  it('should return an error when an invalid story ID is passed to like action', async () => {
    const result = await toggleStoryLikeAction('invalid-id');
    expect(result.success).toBe(false);
  });

  it('should return an error when an unauthenticated visitor tries to save a story', async () => {
    const result = await toggleStorySaveAction(123);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Please sign in to save stories');
  });

  it('should return unauthorized when an unauthenticated user fetches folders', async () => {
    const result = await getUserFoldersAction();
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('should return empty saved folders for unauthenticated user', async () => {
    const result = await getStorySavedFoldersAction(123);
    expect(result.success).toBe(false);
    expect(result.data?.isSaved).toBe(false);
  });

  it('should return error when creating folder unauthenticated or empty name', async () => {
    const result = await createFolderAction('');
    expect(result.success).toBe(false);
  });

  it('should return unauthorized when saving story to folder unauthenticated', async () => {
    const result = await saveStoryToFolderAction(123, 1);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('should return unauthorized when unsaving story from folder unauthenticated', async () => {
    const result = await unsaveStoryFromFolderAction(123, 1);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });
});
