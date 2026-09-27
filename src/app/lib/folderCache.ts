// src/app/lib/folderCache.ts
'use client';

export interface CachedFolder {
  id: number;
  name: string;
  parent_id?: number | null;
}

interface SavedItemRecord {
  id: number;
  folder_id: number | null;
}

type Listener = () => void;

class FolderCacheManager {
  private folders: CachedFolder[] | null = null;
  private savedItemsByStoryId: Map<string, Set<number | 'root'>> = new Map();
  private foldersPromise: Promise<CachedFolder[]> | null = null;
  private savedItemsPromise: Promise<void> | null = null;
  private listeners: Set<Listener> = new Set();

  /**
   * Subscribe to cache updates (e.g., when a folder is created or deleted)
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('FolderCache listener error:', e);
      }
    });
  }

  /**
   * Get cached folders synchronously if available
   */
  getCachedFolders(): CachedFolder[] | null {
    return this.folders;
  }

  /**
   * Fetch and cache the user's folders (de-duplicates in-flight requests)
   */
  async getOrFetchFolders(forceRefresh = false): Promise<CachedFolder[]> {
    if (!forceRefresh && this.folders !== null) {
      return this.folders;
    }

    if (this.foldersPromise) {
      return this.foldersPromise;
    }

    this.foldersPromise = (async () => {
      try {
        const res = await fetch('/api/folders');
        if (!res.ok) {
          if (res.status === 401) {
            this.folders = [];
            return [];
          }
          throw new Error('Failed to fetch folders');
        }
        const data = await res.json();
        if (data.success && Array.isArray(data.data?.folders)) {
          this.folders = data.data.folders;
        } else {
          this.folders = [];
        }
        this.notify();
        return this.folders || [];
      } catch (err) {
        console.error('FolderCache getOrFetchFolders error:', err);
        return this.folders || [];
      } finally {
        this.foldersPromise = null;
      }
    })();

    return this.foldersPromise;
  }

  /**
   * Add a newly created folder to the cache and notify all listeners
   */
  addFolder(folder: CachedFolder) {
    if (!this.folders) {
      this.folders = [folder];
    } else {
      const exists = this.folders.some((f) => f.id === folder.id);
      if (!exists) {
        this.folders = [...this.folders, folder];
      }
    }
    this.notify();
  }

  /**
   * Fetch and cache user's saved items to map story -> folders
   */
  async getOrFetchSavedState(storyId: number | string, forceRefresh = false): Promise<Set<number | 'root'>> {
    const key = String(storyId);

    if (!forceRefresh && this.savedItemsByStoryId.has(key)) {
      return this.savedItemsByStoryId.get(key)!;
    }

    if (this.savedItemsPromise) {
      await this.savedItemsPromise;
      return this.savedItemsByStoryId.get(key) || new Set();
    }

    this.savedItemsPromise = (async () => {
      try {
        const res = await fetch('/api/saved-items');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.data?.savedStories)) {
          const newMap = new Map<string, Set<number | 'root'>>();
          for (const item of data.data.savedStories as SavedItemRecord[]) {
            const sKey = String(item.id);
            if (!newMap.has(sKey)) {
              newMap.set(sKey, new Set());
            }
            const set = newMap.get(sKey)!;
            if (item.folder_id === null || item.folder_id === undefined) {
              set.add('root');
            } else {
              set.add(Number(item.folder_id));
            }
          }
          this.savedItemsByStoryId = newMap;
          this.notify();
        }
      } catch (err) {
        console.error('FolderCache getOrFetchSavedState error:', err);
      } finally {
        this.savedItemsPromise = null;
      }
    })();

    await this.savedItemsPromise;
    return this.savedItemsByStoryId.get(key) || new Set();
  }

  /**
   * Get the saved folder IDs for a story from cache synchronously
   */
  getStorySavedFolders(storyId: number | string): Set<number | 'root'> {
    return this.savedItemsByStoryId.get(String(storyId)) || new Set();
  }

  /**
   * Update saved state for a story in a specific folder
   */
  updateStorySavedInFolder(storyId: number | string, folderId: number | null, isSaved: boolean) {
    const key = String(storyId);
    if (!this.savedItemsByStoryId.has(key)) {
      this.savedItemsByStoryId.set(key, new Set());
    }
    const set = this.savedItemsByStoryId.get(key)!;
    const folderKey = folderId === null ? 'root' : folderId;

    if (isSaved) {
      set.add(folderKey);
    } else {
      set.delete(folderKey);
    }
    this.notify();
  }

  /**
   * Check if a story is saved in any folder (including root)
   */
  isStorySaved(storyId: number | string): boolean {
    const set = this.savedItemsByStoryId.get(String(storyId));
    return Boolean(set && set.size > 0);
  }
}

export const folderCache = new FolderCacheManager();
