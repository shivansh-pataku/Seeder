'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from '../Styles/home.module.css';
import { getGenderAvatar } from '../lib/avatar';

export default function ArticleFeedCard({ article }) {
  const router = useRouter();

  if (!article) return null;

  const handleCardClick = () => {
    router.push(`/read/${article.id}`);
  };

  const isAnonymous = !article.author?.username || article.author.username === 'unknown';

  const handleAuthorClick = (e) => {
    e.stopPropagation();
    if (!isAnonymous) {
      router.push(`/${article.author.username}`);
    }
  };

  // Format date like: "2 Jun, 2024"
  const formattedDate = article.createdAt
    ? new Date(article.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    : '';

  const authorName = isAnonymous ? 'Unknown' : (article.author?.name || article.author?.username || 'Author');
  const authorInitial = (authorName[0] || 'U').toUpperCase();


  return (
    <article className={styles.feedCard} onClick={handleCardClick}>
      {/* Top: Heading & Description with reduced line-spacing and consistent height */}
      <div className={styles.feedCardBody}>
        <h3 className={styles.feedCardTitle}>
          {article.title || 'Untitled Article'}
        </h3>
        <p className={styles.feedCardSnippet}>
          {article.snippet || 'No preview available.'}
        </p>
      </div>

      {/* Divider */}
      <div className={styles.feedCardDivider} />

      {/* Bottom below divider: Profile Header on Left, Published Date on Right */}
      <div className={styles.feedCardFooter}>
        <div
          className={styles.authorInfo}
          onClick={handleAuthorClick}
          style={isAnonymous ? { cursor: 'default' } : { cursor: 'pointer' }}
          title={isAnonymous ? 'Anonymous author' : `View @${article.author?.username || ''}'s profile`}
        >
          <div className={styles.authorAvatar}>
            {!isAnonymous && getGenderAvatar(article.author?.gender) ? (
              <Image
                src={getGenderAvatar(article.author.gender)}
                alt={authorName}
                width={28}
                height={28}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <span>{authorInitial}</span>
            )}
          </div>
          <div className={styles.authorMeta}>
            <span className={styles.authorName}>{authorName}</span>
            <span className={styles.postType}>Article</span>
          </div>
        </div>

        <span className={styles.publishDate}>{formattedDate}</span>
      </div>
    </article>
  );
}
