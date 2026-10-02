'use client';

import React, { useRef, useState, useEffect } from 'react';
import styles from './stories.module.css';
import { Globe, PencilSimple, Trash, Heart } from '@phosphor-icons/react';
import { useInkWell } from '@/app/Components/InkWell';

export interface StoryDeskItem {
  id: number | string;
  title?: string;
  snippet?: string;
  description?: string;
  preview?: string;
  status?: boolean | number;
  created_at?: string;
  word_count?: number;
  reading_time_minutes?: number;
  likes_count?: number;
  likesCount?: number;
}

interface StoryDeskCardProps {
  story: StoryDeskItem;
  onSelect?: (story: StoryDeskItem) => void;
  onTogglePublish?: (id: number | string, currentStatus: boolean) => void;
  onDelete?: (id: number | string) => void;
}

export default function StoryDeskCard({
  story,
  onSelect,
  onTogglePublish,
  onDelete,
}: StoryDeskCardProps) {
  const inkWell = useInkWell();
  const isPublished = Boolean(story.status);
  const displayTitle = story.title?.trim() || 'Untitled Story';
  const displaySnippet = story.snippet || story.preview || 'No content drafted yet...';

  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isSingleLineTitle, setIsSingleLineTitle] = useState(() => (story.title?.trim().length || 0) <= 36);

  useEffect(() => {
    if (titleRef.current) {
      setIsSingleLineTitle(titleRef.current.offsetHeight <= 32);
    }
  }, [story.title]);

  const words = story.word_count || 0;
  const readTimeMin = story.reading_time_minutes || 1;
  const likes = Number(story.likes_count ?? story.likesCount ?? 0);

  const formattedDate = story.created_at
    ? new Date(story.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Draft';

  const handleCardClick = () => {
    if (onSelect) onSelect(story);
  };

  const handlePublishClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTogglePublish) onTogglePublish(story.id, isPublished);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    inkWell.modal({
      title: 'Delete Story?',
      message: `Are you sure you want to delete "${displayTitle}"? This action is permanent and cannot be undone.`,
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: () => {
        if (onDelete) onDelete(story.id);
      },
    });
  };

  return (
    <article className={styles.deskCard} onClick={handleCardClick}>
      {/* Top Banner Row: Status Badge on Left, Word count & read time on Right */}
      <div className={styles.deskHeaderRow}>
        <span
          className={`${styles.statusBadge} ${
            isPublished ? styles.published : styles.draft
          }`}
        >
          {isPublished ? 'Published' : 'Draft'}
        </span>

        <span className={styles.deskReadTime}>
          {words > 0 ? `${words} words • ${readTimeMin} min read` : 'Draft'}
        </span>
      </div>

      {/* Main Content: Title & Snippet */}
      <div>
        <h3 ref={titleRef} className={styles.deskTitle}>{displayTitle}</h3>
        <p className={`${styles.deskSnippet} ${isSingleLineTitle ? styles.snippetExpanded : ''}`}>{displaySnippet}</p>
      </div>

      {/* Footer Bar: Date & Likes on Left, Action buttons on Right */}
      <div className={styles.deskFooter}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span className={styles.deskDate}>{formattedDate}</span>
          <span className={styles.metaLikesBadge} title={`${likes} likes`}>
            <Heart size={13} weight={likes > 0 ? 'fill' : 'regular'} color={likes > 0 ? '#e11d48' : 'currentColor'} />
            <span>{likes}</span>
          </span>
        </div>

        <div className={styles.deskActions}>
          <button
            type="button"
            className={`${styles.deskActionBtn} ${isPublished ? styles.publishedActive : ''}`}
            onClick={handlePublishClick}
            title={isPublished ? 'Make private draft' : 'Publish story'}
          >
            <Globe size={15} weight={isPublished ? 'fill' : 'regular'} />
          </button>

          <button
            type="button"
            className={styles.deskActionBtn}
            onClick={handleCardClick}
            title="Edit story in desk"
          >
            <PencilSimple size={15} weight="regular" />
          </button>

          <button
            type="button"
            className={`${styles.deskActionBtn} ${styles.deleteBtn}`}
            onClick={handleDeleteClick}
            title="Delete story"
          >
            <Trash size={15} weight="regular" />
          </button>
        </div>
      </div>
    </article>
  );
}
