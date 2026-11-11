'use client';

import React, { useState, useRef, useEffect, useOptimistic, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './stories.module.css';
import { getGenderAvatar } from '@/lib/avatar';
import { ShareFat, BookmarkSimple, Heart } from '@phosphor-icons/react';
import { useInkWell } from '@/components/InkWell';
import SaveToFolderPopover from '../SaveToFolderPopover';
import { toggleStoryLikeAction } from '@/app/actions/engagement';

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
  const [isSaved, setIsSaved] = useState(false);
  const [showSavePopover, setShowSavePopover] = useState(false);
  const bookmarkBtnRef = useRef<HTMLButtonElement>(null);

  const initialLikesCount = currentStory?.likes_count ?? currentStory?.likesCount ?? 0;
  const initialIsLiked = Boolean(currentStory?.is_liked || currentStory?.isLiked);

  // React 19 Optimistic Like State for 0ms instantaneous UI feedback
  const [optimisticLike, setOptimisticLike] = useOptimistic(
    { isLiked: initialIsLiked, count: initialLikesCount },
    (state, update: { isLiked: boolean }) => ({
      isLiked: update.isLiked,
      count: update.isLiked ? state.count + 1 : Math.max(0, state.count - 1),
    })
  );

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

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextLiked = !optimisticLike.isLiked;

    startTransition(async () => {
      // 1. Instant 0ms visual feedback
      setOptimisticLike({ isLiked: nextLiked });

      // 2. Execute Server Action
      const result = await toggleStoryLikeAction(currentStory.id);
      if (!result.success) {
        inkWell.toast({
          message: result.error || 'Please sign in to like stories.',
          type: 'info',
        });
      }
    });
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSavePopover((prev) => !prev);
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

      {/* Middle Body: Max 2 lines title, Snippet utilizes remaining space when title is single-line */}
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
        >
          {/* Like Button with Count */}
          <button
            type="button"
            className={`${styles.likeActionBtn} ${optimisticLike.isLiked ? styles.liked : ''}`}
            onClick={handleLikeClick}
            title={optimisticLike.isLiked ? 'Unlike story' : 'Like story'}
            aria-label={optimisticLike.isLiked ? 'Unlike story' : 'Like story'}
            aria-pressed={optimisticLike.isLiked}
          >
            <Heart size={16} weight={optimisticLike.isLiked ? 'fill' : 'regular'} />
            <span className={styles.likeCount}>{optimisticLike.count}</span>
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
            aria-pressed={isSaved}
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


