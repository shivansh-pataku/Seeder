'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '../Styles/logsig.module.css';
import AuthBrandPanel from '../Components/AuthBrandPanel';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset instructions');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.splitPage}>
      {/* LEFT SIDE: Brand Showcase & Geometric Artwork */}
      <AuthBrandPanel
        tagline="Recover your account and writing desk."
        subtext="Enter your registered email and we will send you a secure verification link to reset your password."
      />

      {/* RIGHT SIDE: Authentication Form */}
      <div className={styles.formSide}>
        <div className={styles.formTopMobileLogo}>
          <Link href="/" className={styles.brandLogoMark}>
            {/* <span>✦</span> */}
            <span>Meridian</span>
          </Link>
        </div>

        <div className={styles.formContentWrapper}>
          <div className={styles.logsigHeader} style={{ textAlign: 'left' }}>
            <h1 className={styles.logsigTitle} style={{ textAlign: 'left' }}>
              Reset your password
            </h1>
            <p className={styles.logsigSubtitle} style={{ textAlign: 'left' }}>
              {submitted
                ? 'Check your inbox for the reset link'
                : 'Enter your email address and we will send you a secure reset link.'}
            </p>
          </div>

          {error && (
            <div className={styles.logsigError}>
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div>
              <div className={styles.logsigSuccess}>
                <span>Reset link has been sent to your registered email.</span>
              </div>

              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--task-editor-text-muted, #71717a)',
                  lineHeight: 1.6,
                  margin: '1.25rem 0 1.5rem',
                }}
              >
                We sent a secure password reset link to <strong>{email}</strong>. Please check your inbox and click the link to choose a new password. The link will expire in 30 minutes.
              </p>

              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className={styles.logsigButton}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--min-borders, #27272a)',
                  color: 'var(--foreground)',
                }}
              >
                Resend link or try another email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className={styles.logsigField}>
                <label htmlFor="email" className={styles.logsigLabel}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="name@example.com"
                  required
                  disabled={loading}
                  className={styles.logsigInput}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className={styles.logsigButton}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    <span>Sending reset link...</span>
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}

          <div className={styles.logsigLinks}>
            <Link href="/auth/signin">&larr; Back to Sign In</Link>
          </div>
        </div>

        <div className={styles.formTermsNotice}>
          Need further assistance? <Link href="/about">Contact Support</Link>.
        </div>
      </div>
    </div>
  );
}
