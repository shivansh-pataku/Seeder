import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import { auth } from '@/lib/auth.js';
import { StoryService } from '@/app/api/(modules)/stories/story.service';
import ArticleReadClient, { ReadArticle } from '@/components/Read/ArticleReadClient';
import styles from '@/app/Styles/read.module.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const story = await StoryService.getStoryById(id, null);

  if (!story) {
    return {
      title: 'Story Not Found | Project A',
    };
  }

  return {
    title: `${story.title} | Project A`,
    description: story.snippet || 'Read this story on Project A',
    openGraph: {
      title: story.title,
      description: story.snippet || '',
      type: 'article',
    },
  };
}

export default async function ArticleReadPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  const currentUserId = session?.user?.id ? Number(session.user.id) : null;
  const currentUsername = session?.user?.name || null;

  const story = await StoryService.getStoryById(id, currentUserId);

  if (!story) {
    return (
      <div className={styles.readPageContainer}>
        <div style={{ maxWidth: '480px', margin: '6rem auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Story Not Found</h2>
          <p style={{ color: 'var(--task-editor-text-muted, #666666)', marginBottom: '2rem' }}>
            The requested story does not exist or has not been published yet.
          </p>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} weight="regular" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  const article: ReadArticle = {
    id: story.id,
    title: story.title,
    content: story.description,
    snippet: story.snippet,
    story_type: story.story_type,
    createdAt: story.created_at,
    wordCount: story.word_count,
    readTimeMinutes: story.reading_time_minutes,
    likesCount: story.likes_count,
    isLiked: Boolean(story.is_liked),
    author: story.author
      ? {
          id: story.author.id,
          username: story.author.username,
          name: story.author.name,
          gender: story.author.gender,
        }
      : undefined,
  };

  return (
    <ArticleReadClient
      article={article}
      currentUserId={session?.user?.id || null}
      currentUsername={currentUsername}
    />
  );
}

