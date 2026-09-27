// src/app/lib/likeCache.ts
'use client';

type Listener = () => void;

class LikeCacheManager {
  private likedStories: Set<number> = new Set();
  private storyLikesCounts: Map<number, number> = new Map();
  private isFetched: boolean = false;
  private inFlightFetch: Promise<Set<number>> | null = null;
  private listeners: Set<Listener> = new Set();

  /**
   * Subscribe to like updates across all components
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
        console.error('LikeCache listener error:', e);
      }
    });
  }

  /**
   * Check synchronously if a story is liked
   */
  isStoryLiked(storyId: number | string): boolean {
    const numId = Number(storyId);
    return !isNaN(numId) && this.likedStories.has(numId);
  }

  /**
   * Get the cached like count or return fallback
   */
  getLikesCount(storyId: number | string, fallbackCount: number = 0): number {
    const numId = Number(storyId);
    if (!isNaN(numId) && this.storyLikesCounts.has(numId)) {
      return this.storyLikesCounts.get(numId)!;
    }
    return fallbackCount;
  }

  /**
   * Prime or update the like count for a story
   */
  setLikesCount(storyId: number | string, count: number) {
    const numId = Number(storyId);
    if (!isNaN(numId)) {
      this.storyLikesCounts.set(numId, Math.max(0, count));
    }
  }

  /**
   * Prime or update the liked status for a story
   */
  setStoryLiked(storyId: number | string, liked: boolean) {
    const numId = Number(storyId);
    if (isNaN(numId)) return;
    if (liked) {
      this.likedStories.add(numId);
    } else {
      this.likedStories.delete(numId);
    }
    this.notify();
  }

  /**
   * Fetch and cache all stories liked by the current user
   */
  async getOrFetchLikedStories(forceRefresh = false): Promise<Set<number>> {
    if (!forceRefresh && this.isFetched) {
      return this.likedStories;
    }

    if (this.inFlightFetch) {
      return this.inFlightFetch;
    }

    this.inFlightFetch = (async () => {
      try {
        const res = await fetch('/api/likes');
        if (!res.ok) {
          // If unauthenticated (401), keep empty set without error
          return this.likedStories;
        }

        const data = await res.json();
        if (data.success && Array.isArray(data.data?.likedStories)) {
          this.likedStories.clear();
          data.data.likedStories.forEach((item: { id: number | string; likes_count?: number }) => {
            const numId = Number(item.id);
            if (!isNaN(numId)) {
              this.likedStories.add(numId);
              if (typeof item.likes_count === 'number') {
                this.storyLikesCounts.set(numId, item.likes_count);
              }
            }
          });
          this.isFetched = true;
          this.notify();
        }
      } catch (err) {
        console.warn('Failed to fetch user likes:', err);
      } finally {
        this.inFlightFetch = null;
      }
      return this.likedStories;
    })();

    return this.inFlightFetch;
  }

  /**
   * Optimistically toggle like status with immediate local update and automatic rollback on failure
   */
  async toggleLike(
    storyId: number | string,
    currentCount: number,
    entityType: string = 'story'
  ): Promise<{ liked: boolean; count: number }> {
    const numId = Number(storyId);
    if (isNaN(numId)) {
      throw new Error('Invalid story ID');
    }

    const wasLiked = this.isStoryLiked(numId);
    const newLiked = !wasLiked;
    const newCount = Math.max(0, currentCount + (newLiked ? 1 : -1));

    // 1. Optimistic update
    if (newLiked) {
      this.likedStories.add(numId);
    } else {
      this.likedStories.delete(numId);
    }
    this.storyLikesCounts.set(numId, newCount);
    this.notify();

    // 2. Perform backend mutation
    try {
      const res = await fetch('/api/likes', {
        method: newLiked ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: numId, entityType }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const message = errData.error?.message || errData.message || (newLiked ? 'Failed to like story' : 'Failed to unlike story');
        throw new Error(message);
      }

      return { liked: newLiked, count: newCount };
    } catch (err) {
      // 3. Rollback on failure
      if (wasLiked) {
        this.likedStories.add(numId);
      } else {
        this.likedStories.delete(numId);
      }
      this.storyLikesCounts.set(numId, currentCount);
      this.notify();
      throw err;
    }
  }

  clear() {
    this.likedStories.clear();
    this.storyLikesCounts.clear();
    this.isFetched = false;
    this.notify();
  }
}

export const likeCache = new LikeCacheManager();
