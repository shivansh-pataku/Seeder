'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../Styles/read.module.css';
import typographyStyles from '../../Styles/story-typography.module.css';
import { getGenderAvatar } from '../../lib/avatar';
import { ArrowLeft, PencilSimple, BookmarkSimple, Heart, ShareFat } from '@phosphor-icons/react';
import { useInkWell } from '../../Components/InkWell';
import SaveToFolderPopover from '../../Components/SaveToFolderPopover';
import { folderCache } from '../../lib/folderCache';
import { likeCache } from '../../lib/likeCache';

export default function ArticleReadPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const inkWell = useInkWell();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeHeadingId, setActiveHeadingId] = useState('');

  const [isSaved, setIsSaved] = useState(false);
  const [showSavePopoverTop, setShowSavePopoverTop] = useState(false);
  const [showSavePopoverBottom, setShowSavePopoverBottom] = useState(false);
  const saveBtnTopRef = useRef(null);
  const saveBtnBottomRef = useRef(null);

  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const articleId = params?.id;

  useEffect(() => {
    if (!articleId) return;

    async function fetchArticle() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/articles/${articleId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('This story does not exist or has not been published yet.');
          }
          throw new Error('Failed to load story.');
        }

        const data = await res.json();
        setArticle(data.article);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [articleId]);

  // Synchronize bookmark and like state with global caches
  useEffect(() => {
    if (!article) return;
    const initialLikes = article.likesCount ?? 0;
    const initialLiked = Boolean(article.isLiked);

    if (initialLiked) {
      likeCache.setStoryLiked(article.id, true);
    }
    likeCache.setLikesCount(article.id, initialLikes);

    setIsSaved(folderCache.isStorySaved(article.id));
    setIsLiked(likeCache.isStoryLiked(article.id) || initialLiked);
    setLikesCount(likeCache.getLikesCount(article.id, initialLikes));

    // Ensure caches are populated
    likeCache.getOrFetchLikedStories();
    folderCache.getOrFetchFolders();
    folderCache.getOrFetchSavedState(article.id);

    const unsubFolder = folderCache.subscribe(() => {
      setIsSaved(folderCache.isStorySaved(article.id));
    });

    const unsubLike = likeCache.subscribe(() => {
      setIsLiked(likeCache.isStoryLiked(article.id));
      setLikesCount(likeCache.getLikesCount(article.id, initialLikes));
    });

    return () => {
      unsubFolder();
      unsubLike();
    };
  }, [article]);

  const handleLike = async () => {
    if (!article) return;
    try {
      await likeCache.toggleLike(article.id, likesCount);
    } catch (err) {
      inkWell.toast({
        message: err.message || 'Please sign in to like this story.',
        type: 'info',
      });
    }
  };

  const handleShare = async () => {
    if (!article) return;
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

  const handleSaveClickTop = async (e) => {
    e.stopPropagation();
    if (showSavePopoverTop) {
      setShowSavePopoverTop(false);
      return;
    }
    if (!folderCache.getCachedFolders()) {
      await Promise.all([
        folderCache.getOrFetchFolders(),
        folderCache.getOrFetchSavedState(article.id),
      ]);
    } else {
      await folderCache.getOrFetchSavedState(article.id);
    }
    setShowSavePopoverTop(true);
  };

  const handleSaveClickBottom = async (e) => {
    e.stopPropagation();
    if (showSavePopoverBottom) {
      setShowSavePopoverBottom(false);
      return;
    }
    if (!folderCache.getCachedFolders()) {
      await Promise.all([
        folderCache.getOrFetchFolders(),
        folderCache.getOrFetchSavedState(article.id),
      ]);
    } else {
      await folderCache.getOrFetchSavedState(article.id);
    }
    setShowSavePopoverBottom(true);
  };

  // Extract headings (H1, H2, H3) and inject IDs into the HTML for smooth click-to-scroll TOC
  const { processedHtml, tocItems } = useMemo(() => {
    if (!article?.content) {
      return { processedHtml: '', tocItems: [] };
    }

    const items = [];
    let headingCounter = 0;

    // Neutralize hardcoded text colors and backgrounds from pasted/saved rich text so dark mode is pristine
    const cleanContent = article.content
      .replace(/color\s*:\s*(?:rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)|#000(?:000)?|black|#111(?:111)?|#222(?:222)?)[;]?/gi, '')
      .replace(/background-color\s*:\s*(?:rgb\(\s*(?:2[3-5]\d)\s*,\s*(?:2[3-5]\d)\s*,\s*(?:2[3-5]\d)\s*\)|#fff(?:fff)?|white)[;]?/gi, '');

    const modified = cleanContent.replace(
      /<(h[1-3])\b([^>]*)>(.*?)<\/\1>/gi,
      (match, tag, attrs, text) => {
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
  }, [article?.content]);

  // IntersectionObserver to highlight active TOC section as user scrolls
  useEffect(() => {
    if (!tocItems.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '0px 0px -60% 0px', threshold: 0.1 }
    );

    tocItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [tocItems]);

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90; // offset for sticky navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveHeadingId(id);
    }
  };

  const isAuthor =
    session?.user &&
    article?.author &&
    (session.user.id === article.author.userid ||
      session.user.username === article.author.username);

  const formattedDate = article?.createdAt
    ? new Date(article.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    : '';

  const isAnonymous = !article?.author?.username || article?.author?.username === 'unknown';
  const authorName = isAnonymous ? 'Unknown' : (article?.author?.name || article?.author?.username || 'Author');
  const authorInitial = (authorName[0] || 'U').toUpperCase();

  if (loading) {
    return (
      <div className={styles.readPageContainer}>
        <div style={{ maxWidth: '680px', margin: '4rem auto', textAlign: 'center' }}>
          <div style={{ height: '32px', background: 'var(--min-borders)', borderRadius: '6px', width: '80%', margin: '0 auto 1.5rem auto' }} />
          <div style={{ height: '16px', background: 'var(--min-borders)', borderRadius: '4px', width: '40%', margin: '0 auto 3rem auto' }} />
          <div style={{ height: '14px', background: 'var(--min-borders)', borderRadius: '4px', width: '100%', marginBottom: '1rem' }} />
          <div style={{ height: '14px', background: 'var(--min-borders)', borderRadius: '4px', width: '95%', marginBottom: '1rem' }} />
          <div style={{ height: '14px', background: 'var(--min-borders)', borderRadius: '4px', width: '90%', marginBottom: '1rem' }} />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className={styles.readPageContainer}>
        <div style={{ maxWidth: '480px', margin: '6rem auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Story Not Found</h2>
          <p style={{ color: 'var(--task-editor-text-muted)', marginBottom: '2rem' }}>
            {error || 'The requested story does not exist.'}
          </p>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} weight="regular" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.readPageContainer}>
      <div className={styles.readLayout}>
        {/* ==================================================================
            LEFT SIDEBAR: TABLE OF CONTENTS (PAGE OUTLINE)
            ================================================================== */}
        <aside className={styles.tocSidebar}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={15} weight="regular" />
            <span>Back to Stories</span>
          </Link>

          <div>
            <div className={styles.tocHeader}>
              <BookmarkSimple size={14} weight="regular" />
              <span>Contents</span>
            </div>

            {tocItems.length > 0 ? (
              <ul className={styles.tocList}>
                {tocItems.map((item) => (
                  <li key={item.id}>
                    <span
                      onClick={() => scrollToHeading(item.id)}
                      className={`${styles.tocItem} ${item.level === 'h2'
                        ? styles.tocH2
                        : item.level === 'h3'
                          ? styles.tocH3
                          : ''
                        } ${activeHeadingId === item.id ? styles.active : ''}`}
                    >
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.tocEmpty}>No subheadings in this story</div>
            )}
          </div>
        </aside>

        {/* ==================================================================
            CENTER COLUMN: NARROW READING CANVAS (50-75 CHARS, 18PX, 1.7 LINE HEIGHT)
            ================================================================== */}
        <main className={styles.readingColumn}>

          <header>
            <h1 className={styles.articleTitle}>{article.title}</h1>

            <div className={styles.bylineRow}>
              <span>By</span>
              {!isAnonymous ? (
                <Link
                  href={`/${article.author?.username}`}
                  className={styles.bylineAuthor}
                >
                  {authorName}
                </Link>
              ) : (
                <span className={styles.bylineAuthor}>{authorName}</span>
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

            {/* Top Engagement Action Bar */}
            <div className={styles.readActionBar}>
              <div className={styles.readActionLeft}>
                <button
                  type="button"
                  className={`${styles.readLikeBtn} ${isLiked ? styles.liked : ''}`}
                  onClick={handleLike}
                  title={isLiked ? 'Unlike story' : 'Like story'}
                  aria-label="Like story"
                >
                  <Heart size={18} weight={isLiked ? 'fill' : 'regular'} />
                  <span className={styles.readLikeCount}>{likesCount}</span>
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
                    ref={saveBtnTopRef}
                    type="button"
                    className={`${styles.readActionBtn} ${isSaved ? styles.active : ''}`}
                    onClick={handleSaveClickTop}
                    title={isSaved ? 'Saved to folder' : 'Save story'}
                    aria-label="Save story"
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
          <div className={styles.readActionBarBottom}>
            <div className={styles.readActionLeft}>
              <button
                type="button"
                className={`${styles.readLikeBtn} ${isLiked ? styles.liked : ''}`}
                onClick={handleLike}
                title={isLiked ? 'Unlike story' : 'Like story'}
                aria-label="Like story"
              >
                <Heart size={18} weight={isLiked ? 'fill' : 'regular'} />
                <span className={styles.readLikeCount}>{likesCount}</span>
                <span>{likesCount === 1 ? 'Like' : 'Likes'}</span>
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
          </div>
        </main>

        {/* ==================================================================
            RIGHT SIDEBAR: AUTHOR CARD, METADATA & AUTHOR EDIT SHORTCUT
            ================================================================== */}
        <aside className={styles.authorSidebar}>
          {/* Author Card */}
          <div className={styles.authorCard}>
            <div className={styles.authorCardTop}>
              <div className={styles.largeAvatar} style={{ overflow: 'hidden' }}>
                {!isAnonymous && getGenderAvatar(article.author?.gender) ? (
                  <Image
                    src={getGenderAvatar(article.author.gender)}
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
              <Link
                href={`/${article.author?.username}`}
                className={styles.viewProfileBtn}
              >
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
              <span className={styles.metaValue} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Heart size={13} weight={likesCount > 0 ? 'fill' : 'regular'} color={likesCount > 0 ? '#e11d48' : 'currentColor'} />
                <span>{likesCount}</span>
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
