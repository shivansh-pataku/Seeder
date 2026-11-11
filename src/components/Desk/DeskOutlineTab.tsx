'use client';

import React, { useRef, useEffect } from 'react';
import styles from '@/app/Styles/desk-editor.module.css';
import { ArrowRight, TreeStructure } from '@phosphor-icons/react';

export interface OutlineItem {
  level: number;
  text: string;
  id?: string;
  pos?: number;
}

export interface DeskOutlineTabProps {
  outline: OutlineItem[];
  activeHeadingPos?: number | null;
  onHeadingClick?: (item: OutlineItem) => void;
}

export default function DeskOutlineTab({
  outline = [],
  activeHeadingPos,
  onHeadingClick,
}: DeskOutlineTabProps) {
  const activeItemRef = useRef<HTMLDivElement | null>(null);

  // Keep active heading visible inside the outline list as user scrolls or reads
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [activeHeadingPos]);

  return (
    <div className={styles.outlineTabContainer}>
      <div className={styles.outlineHeaderStrip}>
        <div className={styles.outlineHeaderTitle}>
          <span>Document Map</span>
          <span className={styles.outlineCountBadge}>{outline.length}</span>
        </div>
        <span className={styles.outlineHint}>Click to jump</span>
      </div>

      <div className={styles.outlineListScroll}>
        {outline.length > 0 ? (
          <div className={styles.outlineTree}>
            {outline.map((item, idx) => {
              const levelClass =
                item.level === 1
                  ? styles.levelOne
                  : item.level === 2
                  ? styles.levelTwo
                  : styles.levelThree;

              const levelLabel = `H${item.level}`;
              const isActive =
                activeHeadingPos !== null && activeHeadingPos !== undefined
                  ? item.pos === activeHeadingPos
                  : idx === 0;

              return (
                <div
                  key={item.pos ?? idx}
                  ref={isActive ? activeItemRef : undefined}
                  className={`${styles.outlineTreeItem} ${levelClass} ${
                    isActive ? styles.activeTreeItem : ''
                  }`}
                  onClick={() => onHeadingClick && onHeadingClick(item)}
                  title={item.text}
                >
                  <span className={styles.headingLevelTag}>{levelLabel}</span>
                  <span className={styles.outlineHeadingText}>{item.text}</span>
                  <ArrowRight
                    size={11}
                    weight={isActive ? 'bold' : 'regular'}
                    className={styles.outlineHoverArrow}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.outlineEmptyCard}>
            <TreeStructure size={24} weight="regular" className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>No Headings Found</p>
            <p className={styles.emptySubtitle}>
              Use Heading 1, 2, or 3 formatting in the editor to build your document structure.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

