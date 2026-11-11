'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from '@/app/Styles/read.module.css';
import { ArrowLeft, BookmarkSimple } from '@phosphor-icons/react';

export interface TocItem {
  id: string;
  level: string;
  text: string;
}

export interface ReadingTocSidebarProps {
  tocItems: TocItem[];
  activeHeadingId: string;
  onScrollToHeading: (id: string) => void;
}

export default function ReadingTocSidebar({
  tocItems,
  activeHeadingId,
  onScrollToHeading,
}: ReadingTocSidebarProps) {
  const activeItemRef = useRef<HTMLSpanElement | null>(null);

  // Auto-scroll TOC sidebar to keep active heading in view as user reads
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [activeHeadingId]);

  return (
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
            {tocItems.map((item) => {
              const isActive = activeHeadingId === item.id;
              return (
                <li key={item.id}>
                  <span
                    ref={isActive ? activeItemRef : undefined}
                    onClick={() => onScrollToHeading(item.id)}
                    className={`${styles.tocItem} ${
                      item.level === 'h2'
                        ? styles.tocH2
                        : item.level === 'h3'
                        ? styles.tocH3
                        : ''
                    } ${isActive ? styles.active : ''}`}
                  >
                    {item.text}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className={styles.tocEmpty}>No subheadings in this story</div>
        )}
      </div>
    </aside>
  );
}

