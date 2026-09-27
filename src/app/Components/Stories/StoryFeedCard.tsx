'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './stories.module.css';
import { getGenderAvatar } from '@/app/lib/avatar';
import { ShareFat, BookmarkSimple, Heart } from '@phosphor-icons/react';
import { useInkWell } from '@/app/Components/InkWell';
import SaveToFolderPopover from '../SaveToFolderPopover';
import { folderCache } from '@/app/lib/folderCache';
import { likeCache } from '@/app/lib/likeCache';

export interface StoryAuthor {
  id?: number | null;
  username?: string;
  name?: string;
  gender?: string;
  isPrivate?: boolean;
}

export interface StoryFeedItem {
  id: number | string;
  title?: string;
  snippet?: string;
  description?: string;
  story_type?: string;
  createdAt?: string;
  created_at?: string;
  reading_time_minutes?: number;
  readTimeMinutes?: number;
  word_count?: number;
  wordCount?: number;
  likes_count?: number;
  likesCount?: number;
  is_liked?: boolean;
  isLiked?: boolean;
  author?: StoryAuthor;
}

interface StoryFeedCardProps {
  story?: StoryFeedItem;
  article?: StoryFeedItem; // Backward compatibility with legacy prop
}

export default function StoryFeedCard({ story, article }: StoryFeedCardProps) {
  const currentStory = story || article;
  const router = useRouter();
  const inkWell = useInkWell();
  const [isSaved, setIsSaved] = useState(() => (currentStory ? folderCache.isStorySaved(currentStory.id) : false));
  const [showSavePopover, setShowSavePopover] = useState(false);
  const bookmarkBtnRef = useRef<HTMLButtonElement>(null);

  const initialLikesCount = currentStory?.likes_count ?? currentStory?.likesCount ?? 0;
  const [likesCount, setLikesCount] = useState(() =>
    currentStory ? likeCache.getLikesCount(currentStory.id, initialLikesCount) : initialLikesCount
  );
  const [isLiked, setIsLiked] = useState(() =>
    currentStory ? (likeCache.isStoryLiked(currentStory.id) || Boolean(currentStory.is_liked || currentStory.isLiked)) : false
  );

  // Synchronize bookmark and like state with global caches
  useEffect(() => {
    if (!currentStory) return;
    setIsSaved(folderCache.isStorySaved(currentStory.id));
    setIsLiked(likeCache.isStoryLiked(currentStory.id) || Boolean(currentStory.is_liked || currentStory.isLiked));
    setLikesCount(likeCache.getLikesCount(currentStory.id, initialLikesCount));

    // Ensure user likes are populated in cache
    likeCache.getOrFetchLikedStories();

    const unsubscribeFolder = folderCache.subscribe(() => {
      setIsSaved(folderCache.isStorySaved(currentStory.id));
    });

    const unsubscribeLike = likeCache.subscribe(() => {
      setIsLiked(likeCache.isStoryLiked(currentStory.id));
      setLikesCount(likeCache.getLikesCount(currentStory.id, initialLikesCount));
    });

    return () => {
      unsubscribeFolder();
      unsubscribeLike();
    };
  }, [currentStory, initialLikesCount]);

  if (!currentStory) return null;

  const handleCardClick = () => {
    router.push(`/read/${currentStory.id}`);
  };

  const isAnonymous = !currentStory.author?.username || currentStory.author.username === 'unknown';

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAnonymous && currentStory.author?.username) {
      router.push(`/${currentStory.author.username}`);
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = typeof window !== 'undefined' ? `${window.location.origin}/read/${currentStory.id}` : '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: currentStory.title || 'Story',
          text: currentStory.snippet || '',
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      inkWell.toast({
        message: 'Story link copied to clipboard!',
        type: 'success',
      });
    } catch {
      inkWell.toast({
        message: 'Failed to copy story link.',
        type: 'error',
      });
    }
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await likeCache.toggleLike(currentStory.id, likesCount);
    } catch (err: unknown) {
      inkWell.toast({
        message: (err as Error).message || 'Please sign in to like stories.',
        type: 'info',
      });
    }
  };

  // Pre-fetch folder list & saved status before showing dialog box so there are no loading hiccups
  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showSavePopover) {
      setShowSavePopover(false);
      return;
    }

    // First fetch/ensure the list is in cache before opening the dialog
    if (!folderCache.getCachedFolders()) {
      try {
        await Promise.all([
          folderCache.getOrFetchFolders(),
          folderCache.getOrFetchSavedState(currentStory.id),
        ]);
      } catch (err) {
        console.error('Failed to prefetch folders:', err);
      }
    } else {
      await folderCache.getOrFetchSavedState(currentStory.id);
    }

    setShowSavePopover(true);
  };

  const prewarmCache = () => {
    folderCache.getOrFetchFolders();
    folderCache.getOrFetchSavedState(currentStory.id);
    likeCache.getOrFetchLikedStories();
  };

  // Date formatting: "2 Jun, 2024"
  const rawDate = currentStory.createdAt || currentStory.created_at;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    : '';

  const readTimeMin = currentStory.reading_time_minutes || currentStory.readTimeMinutes || 1;
  const storyType = currentStory.story_type || 'Article';
  const authorName = isAnonymous
    ? 'Unknown'
    : currentStory.author?.name || currentStory.author?.username || 'Author';
  const authorInitial = (authorName[0] || 'U').toUpperCase();
  const avatarUrl = !isAnonymous ? getGenderAvatar(currentStory.author?.gender) : null;

  return (
    <article className={styles.feedCard} onClick={handleCardClick}>
      {/* Top row: Story type on left, Publish date & read time on right */}
      <div className={styles.feedCardTopRow}>
        <span className={styles.storyTypeBadge}>{storyType}</span>
        <span className={styles.topMetaRight}>
          {formattedDate} {formattedDate ? '•' : ''} {readTimeMin} min read
        </span>
      </div>

      {/* Middle Body: Max 2 lines title, Max 3 lines snippet (both justified) */}
      <div className={styles.feedCardBody}>
        <h3 className={styles.feedCardTitle}>
          {currentStory.title || 'Untitled Story'}
        </h3>
        <p className={styles.feedCardSnippet}>
          {currentStory.snippet || 'No preview available.'}
        </p>
      </div>

      {/* Divider */}
      <div className={styles.feedCardDivider} />

      {/* Bottom Footer: Author Profile on Left, Share & Save on Right */}
      <div className={styles.feedCardFooter}>
        <div
          className={styles.authorInfo}
          onClick={handleAuthorClick}
          style={isAnonymous ? { cursor: 'default' } : { cursor: 'pointer' }}
          title={isAnonymous ? 'Anonymous author' : `View @${currentStory.author?.username || ''}'s profile`}
        >
          <div className={styles.authorAvatar}>
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={authorName}
                width={28}
                height={28}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <span>{authorInitial}</span>
            )}
          </div>
          <span className={styles.authorName}>{authorName}</span>
        </div>

        <div
          className={styles.cardActionButtons}
          style={{ position: 'relative' }}
          onMouseEnter={prewarmCache}
        >
          {/* Like Button with Count */}
          <button
            type="button"
            className={`${styles.likeActionBtn} ${isLiked ? styles.liked : ''}`}
            onClick={handleLikeClick}
            title={isLiked ? 'Unlike story' : 'Like story'}
            aria-label={isLiked ? 'Unlike story' : 'Like story'}
          >
            <Heart size={16} weight={isLiked ? 'fill' : 'regular'} />
            <span className={styles.likeCount}>{likesCount}</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            className={styles.cardActionBtn}
            onClick={handleShareClick}
            title="Share story link"
            aria-label="Share story"
          >
            <ShareFat size={16} weight="regular" />
          </button>

          {/* Bookmark Button */}
          <button
            ref={bookmarkBtnRef}
            type="button"
            className={`${styles.cardActionBtn} ${isSaved ? styles.active : ''}`}
            onClick={handleSaveClick}
            title={isSaved ? 'Story saved' : 'Save story'}
            aria-label="Save story"
          >
            <BookmarkSimple size={16} weight={isSaved ? 'fill' : 'regular'} />
          </button>

          <SaveToFolderPopover
            storyId={currentStory.id}
            storyTitle={currentStory.title}
            isOpen={showSavePopover}
            onClose={() => setShowSavePopover(false)}
            onSavedChange={(saved) => setIsSaved(saved)}
            triggerRef={bookmarkBtnRef}
          />
        </div>
      </div>
    </article>
  );
}
