import React, { Suspense } from 'react';
import { auth } from '@/lib/auth.js';
import HeroBanner from '@/components/HeroBanner';
import StoryFeedClient from '@/components/StoryFeedClient';
import FeedSkeleton from '@/components/FeedSkeleton';
import { StoryService } from './api/(modules)/stories/story.service';
import styles from './Styles/home.module.css';

async function StoriesFeedLoader({ isAuthenticated }: { isAuthenticated: boolean }) {
  const stories = await StoryService.getPublishedStories();
  return <StoryFeedClient initialArticles={stories} isAuthenticated={isAuthenticated} />;
}

export default async function HomePage() {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  // 1. Logged-out Visitors: Instant Server-Rendered Landing Banner
  if (!isAuthenticated) {
    return <HeroBanner />;
  }

  // 2. Logged-in Users: Streaming Published Stories Feed with Suspense
  return (
    <Suspense
      fallback={
        <div className={styles.homePage}>
          <section id="feed-section" className={styles.feedSection}>
            <div className={styles.feedHeader}>
              <div className={styles.feedTitleGroup}>
                <h2 className={styles.feedTitle}>Published Stories</h2>
              </div>
              <input
                type="text"
                placeholder="Search stories or authors..."
                disabled
                className={styles.searchInput}
              />
            </div>
            <FeedSkeleton />
          </section>
        </div>
      }
    >
      <StoriesFeedLoader isAuthenticated={isAuthenticated} />
    </Suspense>
  );
}


