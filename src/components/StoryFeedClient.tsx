'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StoryFeedCard, StoryFeedItem } from './Stories';
import styles from '@/app/Styles/home.module.css';
import { PencilSimple } from '@phosphor-icons/react';

interface StoryFeedClientProps {
  initialArticles: StoryFeedItem[];
  isAuthenticated: boolean;
}

export default function StoryFeedClient({
  initialArticles,
  isAuthenticated,
}: StoryFeedClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = (initialArticles || []).filter((article) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const title = article.title?.toLowerCase() || '';
    const author = (article.author?.name || article.author?.username || '').toLowerCase();
    const snippet = article.snippet?.toLowerCase() || '';
    return title.includes(query) || author.includes(query) || snippet.includes(query);
  });

  return (
    <div className={styles.homePage}>
      <section id="feed-section" className={styles.feedSection}>
        <div className={styles.feedHeader}>
          <div className={styles.feedTitleGroup}>
            <h2 className={styles.feedTitle}>Published Stories</h2>
          </div>

          <input
            type="text"
            placeholder="Search stories or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {filteredArticles.length > 0 ? (
          <div className={styles.feedGrid}>
            {filteredArticles.map((article) => (
              <StoryFeedCard key={article.id} story={article} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyFeed}>
            <div className={styles.emptyFeedTitle}>No published stories found</div>
            <p className={styles.emptyFeedText}>
              {searchQuery
                ? `No articles match "${searchQuery}". Try a different keyword.`
                : 'Be the first author to write and publish a story to the platform.'}
            </p>
            <button
              onClick={() => router.push(isAuthenticated ? '/desk/new' : '/auth/signin')}
              className={styles.emptyCtaBtn}
            >
              <PencilSimple size={16} weight="regular" />
              <span>Write a Story</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

