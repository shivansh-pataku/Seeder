import React from 'react';
import type { Metadata } from 'next';
import styles from '@/app/Styles/about.module.css';
import FeedbackForm from '@/components/About/FeedbackForm';
import { PencilSimple, Sparkle, Clock } from '@phosphor-icons/react/dist/ssr';

export const metadata: Metadata = {
  title: 'About | Meridian',
  description: 'Our philosophy and mission: A workspace designed for writing, thinking, and reasoning.',
};

export default function AboutPage() {
  return (
    <div className={styles.aboutContainer}>
      <header className={styles.aboutHeader}>
        <h2 className={styles.title}>Our Philosophy</h2>
        <p className={styles.tagline}>A space designed for writing, thinking, and reasoning.</p>
      </header>

      <section className={styles.philosophyGrid}>
        <div className={styles.philosophyCard}>
          <h3>A Workspace for Every Writer</h3>
          <p>
            We believe that writing is the ultimate tool for structuring human thought.
            For those who already love to write, we provide a clean, distraction-free environment to let your ideas flow.
            For those who want to write but struggle to start, we offer a welcoming space designed to make drafting simple,
            intuitive, and rewarding.
          </p>
        </div>

        <div className={styles.philosophyCard}>
          <h3>Beyond the Facts with Master AI</h3>
          <p>
            Fact-checking is only the beginning. Master AI acts as your collaborative partner,
            helping you go beyond raw statistics and limits. It guides your content structure,
            captures context, maps thematic references, and provides editorial suggestions to ensure
            your arguments are clear, convincing, and well-organized.
          </p>
        </div>
      </section>

      <section className={styles.featuresSection}>
        <h3 className={styles.sectionHeading}>Workspace Features</h3>
        <div className={styles.featuresGrid}>
          <div className={styles.featureItem}>
            <div className={styles.iconWrapper}>
              <PencilSimple size={18} weight="regular" />
            </div>
            <div>
              <h4>Minimalist Editor</h4>
              <p>Clean Markdown editing environment with formatting, headers, list nodes, tables, and live previews.</p>
            </div>
          </div>

          <div className={styles.featureItem}>
            <div className={styles.iconWrapper}>
              <Sparkle size={18} weight="regular" />
            </div>
            <div>
              <h4>Master AI Insights</h4>
              <p>On-demand structured advice, outlining suggestion pathways, and references tracking to master your work.</p>
            </div>
          </div>

          <div className={styles.featureItem}>
            <div className={styles.iconWrapper}>
              <Clock size={18} weight="regular" />
            </div>
            <div>
              <h4>Instant Sync</h4>
              <p>Auto-saving database integration that ensures your notes are backed up, synced, and secure in real time.</p>
            </div>
          </div>
        </div>
      </section>

      <FeedbackForm />
    </div>
  );
}
