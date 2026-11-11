'use client';

import React from 'react';
import styles from '@/app/Styles/library.module.css';
import { BookOpen, BookmarksSimple, Heart } from '@phosphor-icons/react';

export interface LibrarySidebarProps {
  activeTab: 'saves' | 'likes';
  onTabChange: (tab: 'saves' | 'likes') => void;
  savedCount: number;
  likedCount: number;
}

export default function LibrarySidebar({
  activeTab,
  onTabChange,
  savedCount,
  likedCount,
}: LibrarySidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <BookOpen size={18} weight="bold" />
        <span>Your Library</span>
      </div>

      <nav className={styles.sidebarNav}>
        <button
          type="button"
          className={`${styles.navItem} ${activeTab === 'saves' ? styles.active : ''}`}
          onClick={() => onTabChange('saves')}
        >
          <div className={styles.navItemLeft}>
            <BookmarksSimple size={16} weight={activeTab === 'saves' ? 'fill' : 'regular'} />
            <span>Saves</span>
          </div>
          <span className={styles.navBadge}>{savedCount}</span>
        </button>

        <button
          type="button"
          className={`${styles.navItem} ${activeTab === 'likes' ? styles.active : ''}`}
          onClick={() => onTabChange('likes')}
        >
          <div className={styles.navItemLeft}>
            <Heart size={16} weight={activeTab === 'likes' ? 'fill' : 'regular'} />
            <span>Liked Items</span>
          </div>
          <span className={styles.navBadge}>{likedCount}</span>
        </button>
      </nav>
    </aside>
  );
}

