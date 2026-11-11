'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import styles from '@/app/Styles/desk-editor.module.css';
import {
  Plus,
  MagnifyingGlass,
  X,
  Article,
} from '@phosphor-icons/react';

export interface DeskStory {
  id: string | number;
  title?: string;
  snippet?: string;
  description?: string;
  preview?: string;
  status?: boolean | number;
  created_at?: string;
  word_count?: number;
  reading_time_minutes?: number;
}

export interface DeskStoriesTabProps {
  stories: DeskStory[];
  activeStoryId?: string | number | null;
  onSelectStory: (id: string | number) => void;
  onNewStory: () => void;
}

export default function DeskStoriesTab({
  stories = [],
  activeStoryId,
  onSelectStory,
  onNewStory,
}: DeskStoriesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all');
  const activeCardRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll stories list to keep active story card in view
  useEffect(() => {
    if (activeCardRef.current) {
      activeCardRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [activeStoryId]);

  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      if (filterStatus === 'published' && !story.status) return false;
      if (filterStatus === 'draft' && story.status) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = (story.title || '').toLowerCase().includes(query);
        const descMatch = (story.snippet || story.description || story.preview || '').toLowerCase().includes(query);
        return titleMatch || descMatch;
      }

      return true;
    });
  }, [stories, filterStatus, searchQuery]);

  const draftCount = useMemo(() => stories.filter((s) => !s.status).length, [stories]);
  const publishedCount = useMemo(() => stories.filter((s) => Boolean(s.status)).length, [stories]);

  return (
    <div className={styles.storiesTabContainer}>
      {/* Top Action Row: Search Bar + New Story Button */}
      <div className={styles.storiesTopBar}>
        <div className={styles.searchBarWrapper}>
          <MagnifyingGlass size={13} weight="regular" className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.sidebarSearchInput}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className={styles.clearSearchBtn}
              title="Clear search"
            >
              <X size={11} weight="regular" />
            </button>
          )}
        </div>

        <button
          type="button"
          className={styles.newStoryActionBtn}
          onClick={onNewStory}
          title="Create a new story draft"
        >
          <Plus size={13} weight="bold" />
          <span>New</span>
        </button>
      </div>

      {/* Status Filter Segmented Chips */}
      <div className={styles.filterChipsRow}>
        <button
          type="button"
          className={`${styles.filterChip} ${filterStatus === 'all' ? styles.activeChip : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All ({stories.length})
        </button>
        <button
          type="button"
          className={`${styles.filterChip} ${filterStatus === 'draft' ? styles.activeChip : ''}`}
          onClick={() => setFilterStatus('draft')}
        >
          Drafts ({draftCount})
        </button>
        <button
          type="button"
          className={`${styles.filterChip} ${filterStatus === 'published' ? styles.activeChip : ''}`}
          onClick={() => setFilterStatus('published')}
        >
          Published ({publishedCount})
        </button>
      </div>

      {/* Stories Cards List */}
      <div className={styles.storiesListScroll}>
        {filteredStories.length > 0 ? (
          filteredStories.map((story) => {
            const isActive = String(story.id) === String(activeStoryId);
            const isStoryPublished = Boolean(story.status);
            const formattedDate = story.created_at
              ? new Date(story.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Draft';

            // Clean 1-line snippet
            const raw = story.snippet || story.description || story.preview || '';
            const plain = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            const snippetText = plain.length > 70 ? plain.slice(0, 70) + '...' : plain;

            const words = story.word_count || (plain ? plain.split(/\s+/).filter(Boolean).length : 0);

            return (
              <div
                key={story.id}
                ref={isActive ? activeCardRef : undefined}
                className={`${styles.storyCardItem} ${isActive ? styles.activeStoryCard : ''}`}
                onClick={() => onSelectStory(story.id)}
              >
                <div className={styles.storyCardHeader}>
                  <span className={styles.storyCardTitle}>
                    {story.title?.trim() || 'Untitled Story'}
                  </span>
                  <span
                    className={`${styles.storyStatusBadge} ${
                      isStoryPublished ? styles.badgePublished : styles.badgeDraft
                    }`}
                  >
                    <span className={styles.statusDot} />
                    {isStoryPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                {snippetText && (
                  <p className={styles.storyCardSnippet}>{snippetText}</p>
                )}

                <div className={styles.storyCardFooter}>
                  <span className={styles.storyDateMeta}>{formattedDate}</span>
                  {words > 0 && (
                    <span className={styles.storyWordsMeta}>{words} words</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyFilteredStories}>
            <Article size={24} weight="regular" className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>
              {searchQuery ? 'No matching stories' : 'No stories yet'}
            </p>
            <p className={styles.emptySubtitle}>
              {searchQuery
                ? `No drafts or published stories match "${searchQuery}"`
                : 'Start crafting your first story with the button above.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={styles.resetFilterBtn}
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

