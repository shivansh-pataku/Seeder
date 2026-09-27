'use client'

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from '../Styles/about.module.css';
import Link from 'next/link';
import {
  PencilSimple,
  Sparkle,
  Clock,
  Question,
  PaperPlaneTilt,
  EnvelopeSimple,
} from '@phosphor-icons/react';

export default function AboutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (status !== 'authenticated') {
      setError('Please sign in to submit feedback');
      router.push('/auth/signin');
      return;
    }

    if (!feedback.trim()) {
      setError('Please enter your feedback');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/about', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          feedback_text: feedback.trim()
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit feedback');
      }

      setSubmitted(true);
      setFeedback('');

      setTimeout(() => {
        setSubmitted(false);
      }, 3000);

    } catch (err) {
      console.error('Feedback error:', err.message);
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.aboutContainer}>
      {/* Intro Mission Header */}
      <header className={styles.aboutHeader}>
        <h2 className={styles.title}>Our Philosophy</h2>
        <p className={styles.tagline}>A space designed for writing, thinking, and reasoning.</p>
      </header>

      {/* Main Philosophy Grid */}
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

      {/* Feature Highlights Section */}
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

      {/* Bottom Row: Feedback & Contact (Clean, borderless layout) */}
      <section className={styles.bottomSection}>
        <div className={styles.feedbackContainer}>
          <div className={styles.feedbackHeader}>
            <Question size={16} weight="regular" className={styles.feedbackIcon} />
            <h3>Share Your Thoughts</h3>
          </div>
          <p className={styles.feedbackIntro}>
            Have an idea for a feature or found something that could be improved?
            Let us know how we can make your writing workflow even better.
          </p>

          {status === 'unauthenticated' && (
            <div className={styles.authAlert}>
              Please <Link href="/auth/signin" className={styles.authLink}>sign in</Link> to submit feedback.
            </div>
          )}

          {error && <div className={styles.errorAlert}>{error}</div>}

          {/*------------------> to next div */}
        </div>

        <div className={styles.contactContainer}>
          <h3>Get in Touch</h3>
          {submitted ? (
            <div className={styles.successAlert}>
              Thank you! Your feedback has been recorded successfully.
            </div>
          ) : (
            status === 'authenticated' && (
              <form onSubmit={handleSubmit} className={styles.feedbackForm}>
                <textarea
                  className={styles.textBox}
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Tell us what you think..."
                  required
                  disabled={loading}
                  maxLength={1000}
                  rows={4}
                />
                <div className={styles.formMeta}>
                  <span>Submitting as: {session?.user?.name || session?.user?.email}</span>
                  <span>{feedback.length}/1000</span>
                </div>
                <button
                  className={styles.feedbackButton}
                  type="submit"
                  disabled={loading || !feedback.trim()}
                >
                  <PaperPlaneTilt size={13} weight="regular" style={{ marginRight: '6px' }} />
                  {loading ? 'Sending...' : 'Send Feedback'}
                </button>
              </form>
            )
          )}
        </div>

        {/* <div className={styles.contactContainer}>
          <h3>Get in Touch</h3>
          <p className={styles.contactText}>
            We&apos;d love to connect. Reach out to us via email:
          </p>
          <a href="mailto:patakushivansh@gmail.com" className={styles.emailLink}>
            <EnvelopeSimple size={14} weight="regular" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            patakushivansh@gmail.com
          </a>
          <footer className={styles.footerNote}>
            Built with care using Next.js, React, MySQL, and NextAuth.
          </footer>
        </div> */}
      </section>
    </div>
  );
}