'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from '@/app/Styles/read.module.css';
import { getGenderAvatar } from '@/lib/avatar';
import { PencilSimple, Heart } from '@phosphor-icons/react';

export interface AuthorData {
  userid?: number | string;
  username?: string;
  name?: string;
  gender?: string;
}

export interface ArticleData {
  id: number | string;
  createdAt?: string;
  readTimeMinutes?: number;
  wordCount?: number;
  author?: AuthorData;
}

export interface ReadingAuthorSidebarProps {
  article: ArticleData;
  authorName: string;
  authorInitial: string;
  isAnonymous: boolean;
  isAuthor: boolean;
  formattedDate: string;
  likesCount: number;
}

export default function ReadingAuthorSidebar({
  article,
  authorName,
  authorInitial,
  isAnonymous,
  isAuthor,
  formattedDate,
  likesCount,
}: ReadingAuthorSidebarProps) {
  const router = useRouter();

  return (
    <aside className={styles.authorSidebar}>
      {/* Author Card */}
      <div className={styles.authorCard}>
        <div className={styles.authorCardTop}>
          <div className={styles.largeAvatar} style={{ overflow: 'hidden' }}>
            {!isAnonymous && getGenderAvatar(article.author?.gender) ? (
              <Image
                src={getGenderAvatar(article.author?.gender)!}
                alt={authorName}
                width={32}
                height={32}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <span>{authorInitial}</span>
            )}
          </div>
          <div className={styles.authorMeta}>
            <h3 className={styles.authorFullName}>{authorName}</h3>
            <span className={styles.authorUsername}>
              @{isAnonymous ? 'unknown' : article.author?.username}
            </span>
          </div>
        </div>

        {!isAnonymous ? (
          <Link href={`/${article.author?.username}`} className={styles.viewProfileBtn}>
            View Author Profile 
          </Link>
        ) : (
          <div
            className={styles.viewProfileBtn}
            style={{ opacity: 0.6, cursor: 'default', textAlign: 'center' }}
          >
            Anonymous Author
          </div>
        )}

        {isAuthor && (
          <button
            onClick={() => router.push(`/desk/${article.id}`)}
            className={styles.editDeskBtn}
          >
            <PencilSimple size={15} weight="regular" />
            <span>Edit in Desk &rarr;</span>
          </button>
        )}
      </div>

      {/* Story Metadata Box */}
      <div className={styles.metadataBox}>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Published</span>
          <span className={styles.metaValue}>{formattedDate}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Reading Time</span>
          <span className={styles.metaValue}>{article.readTimeMinutes} min</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Word Count</span>
          <span className={styles.metaValue}>{article.wordCount} words</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Likes</span>
          <span
            className={styles.metaValue}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Heart
              size={13}
              weight={likesCount > 0 ? 'fill' : 'regular'}
              color={likesCount > 0 ? '#e11d48' : 'currentColor'}
            />
            <span>{likesCount}</span>
          </span>
        </div>
      </div>
    </aside>
  );
}


