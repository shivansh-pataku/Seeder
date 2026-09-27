'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './stories.module.css';
import { Heart } from '@phosphor-icons/react';

export interface StoryProfileItem {
  id: number | string;
  title?: string;
  snippet?: string;
  description?: string;
  story_type?: string;
  created_at?: string;
  reading_time_minutes?: number;
  word_count?: number;
  likes_count?: number;
  likesCount?: number;
}

interface StoryProfileCardProps {
  story: StoryProfileItem;
}

export default function StoryProfileCard({ story }: StoryProfileCardProps) {
  const router = useRouter();

  if (!story) return null;

  const handleClick = () => {
    // Visitor perspective: always navigates to reading page
    router.push(`/read/${story.id}`);
  };

  const formattedDate = story.created_at
    ? new Date(story.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : '';

  const readTime = story.reading_time_minutes || 1;
  const storyType = story.story_type || 'Article';
  const displayTitle = story.title?.trim() || 'Untitled Story';
  const displaySnippet = story.snippet || 'No preview available.';
  const likes = Number(story.likes_count ?? story.likesCount ?? 0);

  return (
    <article
      className={styles.profileCard}
      onClick={handleClick}
      title="Click to read story"
    >
      {/* Row 1: Title */}
      <h4 className={styles.profileTitle}>{displayTitle}</h4>

      {/* Row 2: Metadata (Story type, date, reading time, likes count) */}
      <div className={styles.profileMetaRow}>
        <span className={styles.profileTypeBadge}>{storyType}</span>
        {formattedDate && (
          <>
            <span className={styles.profileMetaDot}>•</span>
            <span>{formattedDate}</span>
          </>
        )}
        <span className={styles.profileMetaDot}>•</span>
        <span>{readTime} min read</span>
        <span className={styles.profileMetaDot}>•</span>
        <span className={styles.metaLikesBadge} title={`${likes} likes`}>
          <Heart size={12} weight={likes > 0 ? 'fill' : 'regular'} color={likes > 0 ? '#e11d48' : 'currentColor'} />
          <span>{likes}</span>
        </span>
      </div>

      {/* Row 3: Description Snippet (Slim) */}
      <p className={styles.profileSnippet}>{displaySnippet}</p>
    </article>
  );
}
