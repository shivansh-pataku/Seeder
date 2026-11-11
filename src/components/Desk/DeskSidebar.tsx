'use client';

import React, { useState } from 'react';
import styles from '@/app/Styles/desk-editor.module.css';
import { Files, TreeStructure, Sparkle } from '@phosphor-icons/react';
import DeskStoriesTab, { DeskStory } from './DeskStoriesTab';
import DeskOutlineTab, { OutlineItem } from './DeskOutlineTab';
import DeskMasterAiTab from './DeskMasterAiTab';

export interface DeskSidebarProps {
  stories?: DeskStory[];
  activeStoryId?: string | number | null;
  isCollapsed?: boolean;
  onSelectStory: (id: string | number) => void;
  onNewStory: () => void;
  outline?: OutlineItem[];
  activeHeadingPos?: number | null;
  onHeadingClick?: (item: OutlineItem) => void;
  currentTitle?: string;
  currentContent?: string;
}

export default function DeskSidebar({
  stories = [],
  activeStoryId,
  isCollapsed = false,
  onSelectStory,
  onNewStory,
  outline = [],
  activeHeadingPos,
  onHeadingClick,
  currentTitle = '',
  currentContent = '',
}: DeskSidebarProps) {
  const [activeTab, setActiveTab] = useState<'stories' | 'outline' | 'master'>('stories');

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* =====================================================================
          SIDEBAR SEGMENTED TABS (Sharp Linear / Minimalist Style)
          ===================================================================== */}
      <div className={styles.sidebarSegmentedHeader}>
        <div className={styles.sidebarSegmentedTrack}>
          <button
            type="button"
            className={`${styles.sidebarSegmentBtn} ${activeTab === 'stories' ? styles.activeSegment : ''}`}
            onClick={() => setActiveTab('stories')}
            title="Stories and drafts"
          >
            <Files size={13} weight={activeTab === 'stories' ? 'fill' : 'regular'} />
            <span>Stories</span>
            <span className={styles.sidebarBadgeCount}>{stories.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.sidebarSegmentBtn} ${activeTab === 'outline' ? styles.activeSegment : ''}`}
            onClick={() => setActiveTab('outline')}
            title="Document outline"
          >
            <TreeStructure size={13} weight={activeTab === 'outline' ? 'fill' : 'regular'} />
            <span>Outline</span>
            {outline.length > 0 && (
              <span className={styles.sidebarBadgeCount}>{outline.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`${styles.sidebarSegmentBtn} ${activeTab === 'master' ? styles.activeSegment : ''}`}
            onClick={() => setActiveTab('master')}
            title="Master AI Editorial Assistant"
          >
            <Sparkle
              size={13}
              weight={activeTab === 'master' ? 'fill' : 'regular'}
              className={styles.sparkleIcon}
            />
            <span>Master AI</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          SIDEBAR CONTENT CONTAINER (MODULAR SUBCOMPONENTS)
          ===================================================================== */}
      <div className={styles.sidebarContent}>
        {/* TAB 1: STORIES */}
        {activeTab === 'stories' && (
          <DeskStoriesTab
            stories={stories}
            activeStoryId={activeStoryId}
            onSelectStory={onSelectStory}
            onNewStory={onNewStory}
          />
        )}

        {/* TAB 2: OUTLINE */}
        {activeTab === 'outline' && (
          <DeskOutlineTab
            outline={outline}
            activeHeadingPos={activeHeadingPos}
            onHeadingClick={onHeadingClick}
          />
        )}

        {/* TAB 3: MASTER AI */}
        {activeTab === 'master' && (
          <DeskMasterAiTab
            activeStoryId={activeStoryId}
            currentTitle={currentTitle}
            currentContent={currentContent}
          />
        )}
      </div>
    </aside>
  );
}

