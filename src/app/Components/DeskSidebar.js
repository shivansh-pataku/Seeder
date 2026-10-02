'use client';

import React, { useState, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from '../Styles/desk-editor.module.css';
import {
  Plus,
  TreeStructure,
  Files,
  Sparkle,
  MagnifyingGlass,
  X,
  Copy,
  Check,
  Lightbulb,
  Article,
  ArrowRight,
} from '@phosphor-icons/react';

// Helper function to strip HTML tags from editor content
const getPlainTextFromHTML = (html) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
};

export default function DeskSidebar({
  stories = [],
  activeStoryId,
  isCollapsed = false,
  onSelectStory,
  onNewStory,
  outline = [],
  onHeadingClick,
  currentTitle = '',
  currentContent = '',
}) {
  const [activeTab, setActiveTab] = useState('stories'); // 'stories' | 'outline' | 'master'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'draft' | 'published'

  const [aiResultsByStory, setAiResultsByStory] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Active story's AI analysis result (persisted across tab switches for current session)
  const currentResult = aiResultsByStory[activeStoryId] || null;

  // Animate loading steps during AI analysis
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 2 ? prev + 1 : prev));
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Filtered stories calculation
  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      // Status filter
      if (filterStatus === 'published' && !story.status) return false;
      if (filterStatus === 'draft' && story.status) return false;

      // Search filter across title AND snippet / description
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = (story.title || '').toLowerCase().includes(query);
        const descMatch = (story.snippet || story.description || story.preview || '').toLowerCase().includes(query);
        return titleMatch || descMatch;
      }

      return true;
    });
  }, [stories, filterStatus, searchQuery]);

  const draftCount = useMemo(() => stories.filter((s) => !s.status).length, [stories]);
  const publishedCount = useMemo(() => stories.filter((s) => Boolean(s.status)).length, [stories]);

  const handleAnalyzeStory = async () => {
    const cleanTitle = (currentTitle || '').trim();
    const cleanBody = getPlainTextFromHTML(currentContent);

    if (!cleanTitle && !cleanBody) {
      setError('Please write a title or story content before requesting analysis.');
      return;
    }

    setLoading(true);
    setError(null);

    const submissionText = cleanTitle
      ? `Title: ${cleanTitle}\n\n${cleanBody}`
      : cleanBody;

    try {
      const res = await fetch('/api/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: submissionText }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Master AI was unable to analyze this story.');
      }

      setAiResultsByStory((prev) => ({
        ...prev,
        [activeStoryId]: {
          ...data,
          timestamp: new Date().toISOString(),
        },
      }));
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResult = async () => {
    if (!currentResult?.content) return;
    try {
      await navigator.clipboard.writeText(currentResult.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy analysis:', err);
    }
  };

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
            <Sparkle size={13} weight={activeTab === 'master' ? 'fill' : 'regular'} className={styles.sparkleIcon} />
            <span>Master AI</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          SIDEBAR CONTENT CONTAINER
          ===================================================================== */}
      <div className={styles.sidebarContent}>
        {/* TAB 1: STORIES */}
        {activeTab === 'stories' && (
          <div className={styles.storiesTabContainer}>
            {/* Top Action Row: Write Button */}
            <div className={styles.storiesHeaderActions}>
              <button
                type="button"
                className={styles.newStoryActionBtn}
                onClick={onNewStory}
                title="Create a new story draft"
              >
                <Plus size={13} weight="regular" />
                <span>New Story</span>
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className={styles.storiesFilterSection}>
              <div className={styles.searchBarWrapper}>
                <MagnifyingGlass size={12} weight="regular" className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Filter stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.sidebarSearchInput}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={styles.clearSearchBtn}
                    title="Clear search"
                  >
                    <X size={11} weight="regular" />
                  </button>
                )}
              </div>

              {/* Status Filter Chips */}
              <div className={styles.filterChipsRow}>
                <button
                  type="button"
                  className={`${styles.filterChip} ${filterStatus === 'all' ? styles.activeChip : ''}`}
                  onClick={() => setFilterStatus('all')}
                >
                  All ({stories.length})
                </button>
                <button
                  type="button"
                  className={`${styles.filterChip} ${filterStatus === 'draft' ? styles.activeChip : ''}`}
                  onClick={() => setFilterStatus('draft')}
                >
                  Drafts ({draftCount})
                </button>
                <button
                  type="button"
                  className={`${styles.filterChip} ${filterStatus === 'published' ? styles.activeChip : ''}`}
                  onClick={() => setFilterStatus('published')}
                >
                  Published ({publishedCount})
                </button>
              </div>
            </div>

            {/* Stories Cards List */}
            <div className={styles.storiesListScroll}>
              {filteredStories.length > 0 ? (
                filteredStories.map((story) => {
                  const isActive = String(story.id) === String(activeStoryId);
                  const isStoryPublished = Boolean(story.status);
                  const formattedDate = story.created_at
                    ? new Date(story.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Draft';

                  return (
                    <div
                      key={story.id}
                      className={`${styles.storyCardItem} ${isActive ? styles.activeStoryCard : ''}`}
                      onClick={() => onSelectStory(story.id)}
                    >
                      <div className={styles.storyCardHeader}>
                        <span className={styles.storyCardTitle}>
                          {story.title?.trim() || 'Untitled Story'}
                        </span>
                        {isActive && <div className={styles.activePillDot} />}
                      </div>

                      <div className={styles.storyCardFooter}>
                        {/* Simple Text Format for Draft / Published Tag */}
                        <span
                          className={`${styles.storyStatusText} ${
                            isStoryPublished ? styles.statusPublished : styles.statusDraft
                          }`}
                        >
                          {isStoryPublished ? 'Published' : 'Draft'}
                        </span>

                        <span className={styles.storyDateMeta}>
                          {formattedDate}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.emptyFilteredStories}>
                  <Article size={24} weight="regular" className={styles.emptyIcon} />
                  <p className={styles.emptyTitle}>
                    {searchQuery ? 'No matching stories' : 'No stories yet'}
                  </p>
                  <p className={styles.emptySubtitle}>
                    {searchQuery
                      ? `No drafts or published stories match "${searchQuery}"`
                      : 'Start crafting your first story with the button above.'}
                  </p>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className={styles.resetFilterBtn}
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: OUTLINE */}
        {activeTab === 'outline' && (
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

                    return (
                      <div
                        key={idx}
                        className={`${styles.outlineTreeItem} ${levelClass}`}
                        onClick={() => onHeadingClick && onHeadingClick(item)}
                        title={item.text}
                      >
                        <span className={styles.headingLevelTag}>{levelLabel}</span>
                        <span className={styles.outlineHeadingText}>{item.text}</span>
                        <ArrowRight size={11} weight="regular" className={styles.outlineHoverArrow} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.outlineEmptyCard}>
                  <TreeStructure size={26} weight="regular" className={styles.emptyIcon} />
                  <p className={styles.emptyTitle}>No Headings Yet</p>
                  <p className={styles.emptySubtitle}>
                    Add H1, H2, or H3 headings in your story to generate an interactive table of contents.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MASTER AI */}
        {activeTab === 'master' && (
          <div className={styles.masterAiTabContainer}>
            {/* AI Top Hero Banner: only show when NO output is generated */}
            {(!currentResult || !currentResult.content) && (
              <div className={styles.masterAiHeroCard}>
                <div className={styles.masterAiHeroHeader}>
                  <div className={styles.aiBadgeGlow}>
                    <Sparkle size={12} weight="fill" />
                    <span>Editorial Co-Pilot</span>
                  </div>
                </div>
                <p className={styles.masterAiHeroSubtitle}>
                  Contextual intent analysis, authenticity verification, and literary polish.
                </p>
              </div>
            )}

            {/* AI Body View States */}
            {loading ? (
              <div className={styles.aiLoadingStateCard}>
                <div className={styles.aiShimmerBar} />
                <div className={styles.aiLoadingSteps}>
                  <div className={`${styles.aiStepRow} ${loadingStep >= 0 ? styles.stepActive : ''}`}>
                    <div className={styles.stepDot} />
                    <span>Analyzing contextual intent & genre...</span>
                  </div>
                  <div className={`${styles.aiStepRow} ${loadingStep >= 1 ? styles.stepActive : ''}`}>
                    <div className={styles.stepDot} />
                    <span>Evaluating structural logic & authenticity...</span>
                  </div>
                  <div className={`${styles.aiStepRow} ${loadingStep >= 2 ? styles.stepActive : ''}`}>
                    <div className={styles.stepDot} />
                    <span>Formulating prose polish & literary depth...</span>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className={styles.aiErrorStateCard}>
                <span className={styles.aiErrorTitle}>Analysis Notice</span>
                <p className={styles.aiErrorMessage}>{error}</p>
                <button
                  type="button"
                  className={styles.aiPrimaryActionBtn}
                  onClick={handleAnalyzeStory}
                >
                  <Sparkle size={13} weight="regular" />
                  <span>Try Again</span>
                </button>
              </div>
            ) : currentResult && currentResult.content ? (
              <div className={styles.aiResultsContainer}>
                {/* Result Sticky Action Toolbar */}
                <div className={styles.aiResultToolbar}>
                  <div className={styles.aiToolbarDossierBadge}>
                    <Sparkle size={11} weight="fill" className={styles.sparkleIcon} />
                    <span>Editorial Critique</span>
                    <span className={styles.aiToolbarDivider}>•</span>
                    <span className={styles.aiTimestampText}>
                      {currentResult.timestamp
                        ? new Date(currentResult.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Current Draft'}
                    </span>
                  </div>

                  <div className={styles.aiToolbarButtons}>
                    <button
                      type="button"
                      className={styles.aiSmallActionBtn}
                      onClick={handleCopyResult}
                      title="Copy analysis to clipboard"
                    >
                      {copied ? (
                        <>
                          <Check size={11} weight="regular" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} weight="regular" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className={styles.aiSmallActionBtn}
                      onClick={handleAnalyzeStory}
                      title="Re-analyze current draft"
                    >
                      <Sparkle size={11} weight="regular" />
                      <span>Re-analyze</span>
                    </button>
                  </div>
                </div>

                {/* Formatted Markdown Content with Prominent Styled Components */}
                <div className={styles.aiMarkdownContent}>
                  <ReactMarkdown
                    components={{
                      h1: ({ ...props }) => (
                        <div className={styles.aiH1Card}>
                          <h1 {...props} />
                        </div>
                      ),
                      h2: ({ ...props }) => (
                        <div className={styles.aiH2Section}>
                          <span className={styles.aiH2Tag}>SECTION</span>
                          <h2 {...props} />
                        </div>
                      ),
                      h3: ({ ...props }) => (
                        <h3 className={styles.aiH3} {...props} />
                      ),
                      p: ({ ...props }) => <p className={styles.aiP} {...props} />,
                      strong: ({ ...props }) => <strong className={styles.aiStrong} {...props} />,
                      ul: ({ ...props }) => <ul className={styles.aiUl} {...props} />,
                      ol: ({ ...props }) => <ol className={styles.aiOl} {...props} />,
                      li: ({ ...props }) => <li className={styles.aiLi} {...props} />,
                      blockquote: ({ ...props }) => (
                        <blockquote className={styles.aiBlockquote} {...props} />
                      ),
                      code: ({ ...props }) => (
                        <code className={styles.aiCode} {...props} />
                      ),
                      hr: () => <hr className={styles.aiHr} />,
                    }}
                  >
                    {currentResult.content}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              /* Unanalyzed / Ready State */
              <div className={styles.aiReadyContainer}>
                <div className={styles.aiFeaturesGrid}>
                  <div className={styles.aiFeatureCard}>
                    <Sparkle size={15} weight="regular" className={styles.featureIcon} />
                    <div>
                      <div className={styles.featureName}>Context & Genre</div>
                      <div className={styles.featureDesc}>Identifies reader intent, tone, and narrative resonance.</div>
                    </div>
                  </div>

                  <div className={styles.aiFeatureCard}>
                    <Check size={15} weight="regular" className={styles.featureIcon} />
                    <div>
                      <div className={styles.featureName}>Authenticity Check</div>
                      <div className={styles.featureDesc}>Evaluates emotional consistency and logical structure.</div>
                    </div>
                  </div>

                  <div className={styles.aiFeatureCard}>
                    <Lightbulb size={15} weight="regular" className={styles.featureIcon} />
                    <div>
                      <div className={styles.featureName}>Prose Polish</div>
                      <div className={styles.featureDesc}>Recommends diction, pacing, and grammatical fixes.</div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.aiPrimaryActionBtn}
                  onClick={handleAnalyzeStory}
                >
                  <Sparkle size={13} weight="regular" />
                  <span>Analyze Story Draft</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
