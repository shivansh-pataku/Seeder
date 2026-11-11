'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from '@/app/Styles/desk-editor.module.css';
import {
  Sparkle,
  Copy,
  Check,
  Lightbulb,
} from '@phosphor-icons/react';

// Helper function to strip HTML tags from editor content
const getPlainTextFromHTML = (html: string) => {
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

export interface MasterAiResult {
  content?: string;
  timestamp?: string;
  success?: boolean;
  error?: string;
}

export interface DeskMasterAiTabProps {
  activeStoryId?: string | number | null;
  currentTitle?: string;
  currentContent?: string;
}

export default function DeskMasterAiTab({
  activeStoryId,
  currentTitle = '',
  currentContent = '',
}: DeskMasterAiTabProps) {
  const [aiResultsByStory, setAiResultsByStory] = useState<Record<string, MasterAiResult>>({});
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const currentResult = activeStoryId ? aiResultsByStory[String(activeStoryId)] || null : null;

  // Animate loading steps during AI analysis
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 2 ? prev + 1 : prev));
      }, 1800);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

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

      if (activeStoryId) {
        setAiResultsByStory((prev) => ({
          ...prev,
          [String(activeStoryId)]: {
            ...data,
            timestamp: new Date().toISOString(),
          },
        }));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during analysis.';
      setError(message);
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
  );
}

