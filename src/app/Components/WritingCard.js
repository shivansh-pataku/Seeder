'use client';

import styles from '../Styles/desk.module.css';
import { Globe, PencilSimple, Trash } from '@phosphor-icons/react';

// Extract plain text from HTML for word counting and snippets
const getPlainText = (html) => {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

export default function WritingCard({ story, onSelect, onTogglePublish, onDelete }) {
  const isPublished = Boolean(story.status);
  const plainText = getPlainText(story.preview || story.description);

  const displayTitle = story.title?.trim() || 'Untitled Story';
  const displaySnippet = plainText || 'No content drafted yet...';

  // Compute word count and reading time
  const words = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const readTimeMin = Math.max(1, Math.ceil(words / 200));

  // Format date
  const formattedDate = story.created_at
    ? new Date(story.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    : 'Draft';

  const handleCardClick = () => {
    if (onSelect) onSelect(story);
  };

  const handlePublishClick = (e) => {
    e.stopPropagation();
    if (onTogglePublish) onTogglePublish(story.id, isPublished);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(story.id);
  };

  return (
    <article className={styles.writingCard} onClick={handleCardClick}>
      {/* Top Banner Row: Status Badge on Left, Words/Read Time on Right */}
      <div className={styles.cardHeaderRow}>
        <div className={styles.badgeGroup}>
          <span className={`${styles.statusBadge} ${isPublished ? styles.published : styles.draft}`}>
            {isPublished ? 'Published' : 'Draft'}
          </span>
        </div>

        <span className={styles.readTime}>
          {words > 0 ? `${words} words • ${readTimeMin} min read` : 'Draft'}
        </span>
      </div>

      {/* Main Banner Content */}
      <div className={styles.cardTop}>
        <h3 className={styles.cardTitle}>{displayTitle}</h3>
        <p className={styles.cardSnippet}>{displaySnippet}</p>
      </div>

      {/* Banner Footer Bar */}
      <div className={styles.cardFooter}>
        <div className={styles.cardMeta}>
          <span className={styles.cardDate}>{formattedDate}</span>
        </div>

        <div className={styles.cardActions}>
          <button
            type="button"
            className={`${styles.actionIconBtn} ${isPublished ? styles.publishActive : ''}`}
            onClick={handlePublishClick}
            title={isPublished ? "Make private draft (hide from profile)" : "Publish to public profile"}
          >
            <Globe size={15} weight={isPublished ? "fill" : "regular"} />
          </button>

          <button
            type="button"
            className={styles.actionIconBtn}
            onClick={handleCardClick}
            title="Edit story"
          >
            <PencilSimple size={15} weight="regular" />
          </button>

          <button
            type="button"
            className={`${styles.actionIconBtn} ${styles.delete}`}
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
