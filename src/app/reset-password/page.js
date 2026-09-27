'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../Styles/logsig.module.css';
import AuthBrandPanel from '../Components/AuthBrandPanel';
import { Eye, EyeSlash } from '@phosphor-icons/react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTokenInvalid, setIsTokenInvalid] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsTokenInvalid(false);
    setLoading(true);
    setSuccess(false);

    try {
      if (!token) {
        setIsTokenInvalid(true);
        throw new Error('Missing password reset token. Please use the link sent to your email.');
      }

      if (!password || !confirmPassword) {
        throw new Error('Please fill in both password fields');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If the token is invalid or expired
        if (res.status === 400 && data.error?.toLowerCase().includes('expired')) {
          setIsTokenInvalid(true);
        }
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/signin');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Strict check: if no token is in the URL, block access
  if (!token) {
    return (
      <div className={styles.splitPage}>
        <AuthBrandPanel
          tagline="Secure Your Account & Writings."
          subtext="Create a strong, verified password to protect your articles, drafts, and desk."
        />
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
                Link Required
              </h1>
              <p className={styles.logsigSubtitle} style={{ textAlign: 'left' }}>
                This password reset page can only be accessed through the secure link sent to your email address.
              </p>
            </div>

            <div className={styles.logsigError}>
              <span>No reset token provided.</span>
            </div>

            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--task-editor-text-muted, #71717a)',
                lineHeight: 1.6,
                margin: '1.25rem 0 1.5rem',
              }}
            >
              Please request a reset link first by entering your registered account email.
            </p>

            <Link
              href="/forgot-password"
              className={styles.logsigButton}
              style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
            >
              Go to Forgot Password
            </Link>

            <div className={styles.logsigLinks} style={{ marginTop: '1.5rem' }}>
              <Link href="/auth/signin">&larr; Back to Sign In</Link>
            </div>
          </div>

          <div className={styles.formTermsNotice}>
            Need assistance? <Link href="/about">Contact Support</Link>.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.splitPage}>
      <AuthBrandPanel
        tagline="Secure Your Account & Writings."
        subtext="Create a strong, verified password to protect your articles, drafts, and desk."
      />

      <div className={styles.formSide}>
        <div className={styles.formTopMobileLogo}>
          <Link href="/" className={styles.brandLogoMark}>
            {/* <span>✦ </span> */}
            <span>Meridian</span>
          </Link>
        </div>

        <div className={styles.formContentWrapper}>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className={styles.logsigHeader} style={{ textAlign: 'left' }}>
              <h1 className={styles.logsigTitle} style={{ textAlign: 'left' }}>
                Set New Password
              </h1>
              <p className={styles.logsigSubtitle} style={{ textAlign: 'left' }}>
                Create a new secure password for your account
              </p>
            </div>

            {error && (
              <div className={styles.logsigError}>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className={styles.logsigSuccess}>
                <span>Password updated successfully! Redirecting to sign in...</span>
              </div>
            )}

            {isTokenInvalid ? (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link
                  href="/forgot-password"
                  className={styles.logsigButton}
                  style={{ display: 'inline-block', textDecoration: 'none' }}
                >
                  Request New Reset Link
                </Link>
              </div>
            ) : (
              <>
                <div className={styles.logsigField}>
                  <label htmlFor="password" className={styles.logsigLabel}>
                    New Password
                  </label>
                  <div className={styles.passwordWrapper}>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      disabled={loading || success}
                      className={styles.passwordInput}
                      autoComplete="new-password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className={styles.passwordToggle}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeSlash size={18} weight="regular" />
                      ) : (
                        <Eye size={18} weight="regular" />
                      )}
                    </button>
                  </div>
                </div>

                <div className={styles.logsigField}>
                  <label htmlFor="confirmPassword" className={styles.logsigLabel}>
                    Confirm New Password
                  </label>
                  <div className={styles.passwordWrapper}>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
                      disabled={loading || success}
                      className={styles.passwordInput}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className={styles.passwordToggle}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeSlash size={18} weight="regular" />
                      ) : (
                        <Eye size={18} weight="regular" />
                      )}
                    </button>
                  </div>
                  {!passwordsMatch && (
                    <div className={styles.fieldError}>Passwords do not match</div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !passwordsMatch || !password || !confirmPassword || success}
                  className={styles.logsigButton}
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner} />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    'Set New Password'
                  )}
                </button>
              </>
            )}

            <div className={styles.logsigLinks}>
              <Link href="/auth/signin">&larr; Back to Sign In</Link>
            </div>
          </form>
        </div>

        <div className={styles.formTermsNotice}>
          Need further assistance? <Link href="/about">Contact Support</Link>.
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.logsigContainer}>
          <div className={styles.logsigForm} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <span className={styles.spinner} style={{ width: 24, height: 24 }} />
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
