'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '@/app/Styles/about.module.css';
import { Question, PaperPlaneTilt } from '@phosphor-icons/react';

export default function FeedbackForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
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
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          feedback_text: feedback.trim(),
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
    } catch (err: any) {
      console.error('Feedback error:', err.message);
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
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
                onChange={(e) => setFeedback(e.target.value)}
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
    </section>
  );
}
