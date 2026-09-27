'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StoryFeedCard, StoryFeedItem } from './Components/Stories';
import styles from './Styles/home.module.css';
import {
  PencilSimple,
  Sparkle,
  BookmarkSimple,
} from '@phosphor-icons/react';

type Article = StoryFeedItem;

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchPublishedArticles() {
      try {
        setLoading(true);
        const res = await fetch('/api/articles');
        if (res.ok) {
          const data = await res.json();
          setArticles(data.articles || []);
        }
      } catch (err) {
        console.error('Failed to fetch articles:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPublishedArticles();
  }, [isAuthenticated]);

  const filteredArticles = articles.filter((article) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const title = article.title?.toLowerCase() || '';
    const author = (article.author?.name || article.author?.username || '').toLowerCase();
    const snippet = article.snippet?.toLowerCase() || '';
    return title.includes(query) || author.includes(query) || snippet.includes(query);
  });

  // 1. Logged-out Visitors: ONLY full-screen non-scrollable banner
  if (!isAuthenticated) {
    return (
      <div className={styles.homePageLocked}>
        <section className={styles.heroBannerFull}>
          <div className={styles.mediumContainer}>
            {/* LHS: Massive Literary Headline, Subtitle, & Pill CTAs */}
            <div className={styles.mediumLhs}>
              <h1 className={styles.mediumTitle}>
                Human stories<br />&amp; ideas.
              </h1>
              <p className={styles.mediumSubtitle}>
                A quiet place to read, write, and deepen your understanding of the world.
              </p>
              <div className={styles.mediumActions}>
                <Link
                  href="/auth/signin?callbackUrl=/"
                  className={styles.mediumPrimaryBtn}
                >
                  Start reading
                </Link>
                <Link
                  href="/auth/signin?callbackUrl=/desk/new"
                  className={styles.mediumSecondaryBtn}
                >
                  Start writing
                </Link>
              </div>
            </div>

            {/* RHS: Medium-Style Editorial Showcase Card */}
            <div className={styles.mediumRhs}>
              <div className={styles.editorialCard}>
                <div className={styles.cardCuratorRow}>
                  <div className={styles.curatorLeft}>
                    <div className={styles.curatorAvatar}>M</div>
                    <div className={styles.curatorMeta}>
                      <span className={styles.curatorPublication}>in Meridian Essays</span>
                      <span className={styles.curatorAuthor}>Curated by Editorial Staff</span>
                    </div>
                  </div>
                  <div className={styles.staffPickBadge}>
                    <Sparkle size={13} weight="regular" />
                    <span>Staff Pick</span>
                  </div>
                </div>

                <h3 className={styles.cardStoryTitle}>
                  The Art of Slow Thinking in an Accelerated World
                </h3>

                <p className={styles.cardStorySnippet}>
                  We are drowning in information while starving for wisdom. True insight does not
                  emerge from instant reactions; it requires the quiet patience of deep contemplation,
                  stripping away the noise to discover what genuinely matters.
                </p>

                <div className={styles.cardStoryFooter}>
                  <div className={styles.cardStoryMeta}>
                    <span>5 min read</span>
                    <span className={styles.metaDot}>•</span>
                    <span>Selected for you</span>
                  </div>
                  <button className={styles.cardBookmarkBtn} title="Save story" aria-label="Save story">
                    <BookmarkSimple size={17} weight="regular" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // 2. Logged-in Users: ONLY published stories feed (without categories)
  return (
    <div className={styles.homePage}>
      <section id="feed-section" className={styles.feedSection}>

        <div className={styles.feedHeader}>
          <div className={styles.feedTitleGroup}>
            <h2 className={styles.feedTitle}>Published Stories</h2>
            {/* <p className={styles.feedSubtitle}>
              Explore public stories and essays written by community authors
            </p> */}
          </div>

          <input
            type="text"
            placeholder="Search stories or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {loading ? (
          <div className={styles.feedGrid}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className={styles.feedCard}
                style={{ opacity: 0.5 }}
              >
                {/* Title & snippet skeleton */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ height: '22px', background: 'var(--min-borders)', width: '75%', marginBottom: '0.55rem' }} />
                  <div style={{ height: '14px', background: 'var(--min-borders)', width: '100%', marginBottom: '0.4rem' }} />
                  <div style={{ height: '14px', background: 'var(--min-borders)', width: '88%', marginBottom: '0.4rem' }} />
                  <div style={{ height: '14px', background: 'var(--min-borders)', width: '65%' }} />
                </div>

                {/* Divider skeleton */}
                <div className={styles.feedCardDivider} />

                {/* Bottom author row skeleton */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '0px', background: 'var(--min-borders)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ width: '75px', height: '10px', background: 'var(--min-borders)' }} />
                      <div style={{ width: '40px', height: '8px', background: 'var(--min-borders)' }} />
                    </div>
                  </div>
                  <div style={{ width: '60px', height: '10px', background: 'var(--min-borders)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredArticles.length > 0 ? (
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