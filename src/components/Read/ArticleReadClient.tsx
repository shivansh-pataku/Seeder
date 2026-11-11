'use client';

import React, { useEffect, useState, useMemo, useRef, useOptimistic, startTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/app/Styles/read.module.css';
import typographyStyles from '@/app/Styles/story-typography.module.css';
import { BookmarkSimple, Heart, ShareFat } from '@phosphor-icons/react';
import { useInkWell } from '../InkWell';
import SaveToFolderPopover from '../SaveToFolderPopover';
import { toggleStoryLikeAction } from '@/app/actions/engagement';
import { getGenderAvatar } from '@/lib/avatar';
import type { ReadArticle } from '@/types/story';
import ReadingTocSidebar from './ReadingTocSidebar';

export type { ReadArticle };

interface ArticleReadClientProps {
  article: ReadArticle;
  currentUserId?: string | number | null;
  currentUsername?: string | null;
}

export default function ArticleReadClient({
  article,
  currentUserId,
  currentUsername,
}: ArticleReadClientProps) {
  const inkWell = useInkWell();
  const [activeHeadingId, setActiveHeadingId] = useState('');

  const [isSaved, setIsSaved] = useState(false);
  const [showSavePopoverTop, setShowSavePopoverTop] = useState(false);
  const [showSavePopoverBottom, setShowSavePopoverBottom] = useState(false);
  const saveBtnTopRef = useRef<HTMLButtonElement | null>(null);
  const saveBtnBottomRef = useRef<HTMLButtonElement | null>(null);

  const initialLikes = article.likesCount ?? 0;
  const initialLiked = Boolean(article.isLiked);

  // React 19 Optimistic Like State with 0ms visual feedback
  const [optimisticLike, setOptimisticLike] = useOptimistic(
    { isLiked: initialLiked, count: initialLikes },
    (state, update: { isLiked: boolean }) => ({
      isLiked: update.isLiked,
      count: update.isLiked ? state.count + 1 : Math.max(0, state.count - 1),
    })
  );

  const handleLike = () => {
    const nextLiked = !optimisticLike.isLiked;

    startTransition(async () => {
      // 1. Instant 0ms visual update
      setOptimisticLike({ isLiked: nextLiked });

      // 2. Trigger Server Action with automatic revalidation
      const result = await toggleStoryLikeAction(article.id);
      if (!result.success) {
        inkWell.toast({
          message: result.error || 'Please sign in to like this story.',
          type: 'info',
        });
      }
    });
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title || 'Story',
          text: article.snippet || '',
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

  const handleSaveClickTop = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSavePopoverTop((prev) => !prev);
  };

  const handleSaveClickBottom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSavePopoverBottom((prev) => !prev);
  };

  // Extract headings (H1, H2, H3) and inject IDs into the HTML for smooth click-to-scroll TOC
  const { processedHtml, tocItems } = useMemo(() => {
    if (!article.content) {
      return { processedHtml: '', tocItems: [] };
    }

    const items: Array<{ id: string; level: string; text: string }> = [];
    let headingCounter = 0;

    // Neutralize hardcoded text colors and backgrounds from pasted/saved rich text so dark mode is pristine
    const cleanContent = article.content
      .replace(
        /color\s*:\s*(?:rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)|#000(?:000)?|black|#111(?:111)?|#222(?:222)?)[;]?/gi,
        ''
      )
      .replace(
        /background-color\s*:\s*(?:rgb\(\s*(?:2[3-5]\d)\s*,\s*(?:2[3-5]\d)\s*,\s*(?:2[3-5]\d)\s*\)|#fff(?:fff)?|white)[;]?/gi,
        ''
      );

    const modified = cleanContent.replace(
      /<(h[1-3])\b([^>]*)>(.*?)<\/\1>/gi,
      (match: string, tag: string, attrs: string, text: string) => {
        const id = `heading-section-${headingCounter++}`;
        const cleanText = text.replace(/<[^>]+>/g, '').trim();

        if (cleanText) {
          items.push({
            id,
            level: tag.toLowerCase(),
            text: cleanText,
          });
        }

        return `<${tag} id="${id}" ${attrs}>${text}</${tag}>`;
      }
    );

    return { processedHtml: modified, tocItems: items };
  }, [article.content]);

  // Scroll spy to accurately highlight active TOC section as user reads down the page
  useEffect(() => {
    if (!tocItems.length) return;

    let ticking = false;

    const updateActiveHeading = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const READING_OFFSET = 120; // Offset below sticky header (navbar + breathing room)

      // 1. If scrolled near the bottom of the page, activate the last heading
      if (scrollY + windowHeight >= documentHeight - 60) {
        setActiveHeadingId(tocItems[tocItems.length - 1].id);
        return;
      }

      // 2. Find the last heading that has passed (or is at) the reading line
      let currentActiveId = tocItems[0].id;

      for (let i = 0; i < tocItems.length; i++) {
        const item = tocItems[i];
        const el = document.getElementById(item.id);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        // If rect.top <= READING_OFFSET, this heading has reached or passed the reading line
        if (rect.top <= READING_OFFSET) {
          currentActiveId = item.id;
        } else {
          break;
        }
      }

      setActiveHeadingId(currentActiveId);
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveHeading();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial check on mount/load
    updateActiveHeading();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [tocItems]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90; // offset for sticky navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveHeadingId(id);
    }
  };

  const isAuthor = Boolean(
    (currentUserId && article.author?.id && String(currentUserId) === String(article.author.id)) ||
      (currentUsername && article.author?.username && currentUsername === article.author.username)
  );

  const formattedDate = article.createdAt
    ? new Date(article.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const isAnonymous = !article.author?.username || article.author?.username === 'unknown';
  const authorName = isAnonymous
    ? 'Unknown'
    : article.author?.name || article.author?.username || 'Author';
  const authorInitial = (authorName[0] || 'U').toUpperCase();
  const avatarUrl = !isAnonymous ? getGenderAvatar(article.author?.gender) : null;

  return (
    <div className={styles.readPageContainer}>
      <div className={styles.readLayout}>
        {/* ==================================================================
            LEFT SIDEBAR: TABLE OF CONTENTS (PAGE OUTLINE)
            ================================================================== */}
        <ReadingTocSidebar
          tocItems={tocItems}
          activeHeadingId={activeHeadingId}
          onScrollToHeading={scrollToHeading} 
        />

        {/* ==================================================================
            CENTER COLUMN: NARROW READING CANVAS
            ================================================================== */}
        <main className={styles.readingColumn}>
          <header>
            <h1 className={styles.articleTitle}>{article.title}</h1>

            {/* Top Engagement Action Bar */}
            <div className={styles.readActionBar}>
              <div className={styles.bylineRow}>
                <span>By</span>
                {!isAnonymous ? (
                  <Link href={`/${article.author?.username}`} className={styles.bylineAuthorLink}>
                    <div className={styles.bylineAvatar}>
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={authorName}
                          width={24}
                          height={24}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <span>{authorInitial}</span>
                      )}
                    </div>
                    <span className={styles.bylineAuthor}>{authorName}</span>
                  </Link>
                ) : (
                  <div className={styles.bylineAuthorGroup}>
                    <div className={styles.bylineAvatar}>
                      <span>{authorInitial}</span>
                    </div>
                    <span className={styles.bylineAuthor}>{authorName}</span>
                  </div>
                )}
                {formattedDate && (
                  <>
                    <span className={styles.bylineDot}>•</span>
                    <time dateTime={article.createdAt}>{formattedDate}</time>
                  </>
                )}
                {article.readTimeMinutes && (
                  <>
                    <span className={styles.bylineDot}>•</span>
                    <span>{article.readTimeMinutes} min read</span>
                  </>
                )}
              </div>

              <div className={styles.readActionRight}>
                              <div className={styles.readActionLeft}>
                <button
                  type="button"
                  className={`${styles.readLikeBtn} ${optimisticLike.isLiked ? styles.liked : ''}`}
                  onClick={handleLike}
                  title={optimisticLike.isLiked ? 'Unlike story' : 'Like story'}
                  aria-label="Like story"
                  aria-pressed={optimisticLike.isLiked}
                >
                  <Heart size={18} weight={optimisticLike.isLiked ? 'fill' : 'regular'} />
                  <span className={styles.readLikeCount}>{optimisticLike.count}</span>
                </button>
              </div>

                <button
                  type="button"
                  className={styles.readActionBtn}
                  onClick={handleShare}
                  title="Share story link"
                  aria-label="Share story"
                >
                  <ShareFat size={16} weight="regular" />
                  <span>Share</span>
                </button>

                <div style={{ position: 'relative' }}>
                  <button
                    ref={saveBtnTopRef}
                    type="button"
                    className={`${styles.readActionBtn} ${isSaved ? styles.active : ''}`}
                    onClick={handleSaveClickTop}
                    title={isSaved ? 'Saved to folder' : 'Save story'}
                    aria-label="Save story"
                    aria-pressed={isSaved}
                  >
                    <BookmarkSimple size={16} weight={isSaved ? 'fill' : 'regular'} />
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>

                  <SaveToFolderPopover
                    storyId={article.id}
                    storyTitle={article.title}
                    isOpen={showSavePopoverTop}
                    onClose={() => setShowSavePopoverTop(false)}
                    onSavedChange={(saved) => setIsSaved(saved)}
                    triggerRef={saveBtnTopRef}
                  />
                </div>
              </div>
            </div>
          </header>

          <article
            className={typographyStyles.storyContent}
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />

          {/* Bottom Engagement Action Bar */}
          {/* <div className={styles.readActionBarBottom}>
            <div className={styles.readActionLeft}>
              <button
                type="button"
                className={`${styles.readLikeBtn} ${optimisticLike.isLiked ? styles.liked : ''}`}
                onClick={handleLike}
                title={optimisticLike.isLiked ? 'Unlike story' : 'Like story'}
                aria-label="Like story"
                aria-pressed={optimisticLike.isLiked}
              >
                <Heart size={18} weight={optimisticLike.isLiked ? 'fill' : 'regular'} />
                <span className={styles.readLikeCount}>{optimisticLike.count}</span>
                <span>{optimisticLike.count === 1 ? 'Like' : 'Likes'}</span>
              </button>
            </div>

            <div className={styles.readActionRight}>
              <button
                type="button"
                className={styles.readActionBtn}
                onClick={handleShare}
                title="Share story link"
                aria-label="Share story"
              >
                <ShareFat size={16} weight="regular" />
                <span>Share</span>
              </button>

              <div style={{ position: 'relative' }}>
                <button
                  ref={saveBtnBottomRef}
                  type="button"
                  className={`${styles.readActionBtn} ${isSaved ? styles.active : ''}`}
                  onClick={handleSaveClickBottom}
                  title={isSaved ? 'Saved to folder' : 'Save story'}
                  aria-label="Save story"
                  aria-pressed={isSaved}
                >
                  <BookmarkSimple size={16} weight={isSaved ? 'fill' : 'regular'} />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>

                <SaveToFolderPopover
                  storyId={article.id}
                  storyTitle={article.title}
                  isOpen={showSavePopoverBottom}
                  onClose={() => setShowSavePopoverBottom(false)}
                  onSavedChange={(saved) => setIsSaved(saved)}
                  triggerRef={saveBtnBottomRef}
                />
              </div>
            </div>
          </div> */}
        </main>

        {/* ==================================================================
            RIGHT SIDEBAR: AUTHOR CARD, METADATA & AUTHOR EDIT SHORTCUT
            ================================================================== */}
        {/* <ReadingAuthorSidebar
          article={article}
          authorName={authorName}
          authorInitial={authorInitial}
          isAnonymous={isAnonymous}
          isAuthor={isAuthor}
          formattedDate={formattedDate}
          likesCount={optimisticLike.count}
        /> */}
      </div>
    </div>
  );
}
