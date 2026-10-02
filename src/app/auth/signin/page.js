'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import styles from '../../Styles/logsig.module.css';
import AuthBrandPanel from '../../Components/AuthBrandPanel';
import { Eye, EyeSlash } from '@phosphor-icons/react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password.');
      }

      // Check providers availability
      const providersResponse = await fetch('/api/auth/providers');
      if (!providersResponse.ok) {
        setError('Authentication service unavailable');
        return;
      }

      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const targetUrl = searchParams?.get('callbackUrl') || '/desk';

      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl: targetUrl,
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError('Invalid email or password');
        } else {
          setError(`Login failed: ${result.error}`);
        }
      } else if (result?.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = targetUrl;
        }, 800);
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.splitPage}>
      {/* LEFT SIDE: Brand Showcase & Geometric Artwork */}
      <AuthBrandPanel
        tagline="A workspace designed for writing, thinking, and reasoning."
        subtext="Sign in to resume drafting stories, organizing thoughts, and accessing your desk."
      />

      {/* RIGHT SIDE: Authentication Form */}
      <div className={styles.formSide}>
        <div className={styles.formTopLogo}>
          <Link href="/" className={styles.brandLogoMark}>
            {/* Future Logo Image Placeholder: */}
            {/* <Image src="/logo.png" alt="Meridian Logo" width={32} height={32} priority /> */}
            <span>Meridian</span>
          </Link>
        </div>

        <div className={styles.formContentWrapper}>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className={styles.logsigHeader} style={{ textAlign: 'left' }}>
              <h1 className={styles.logsigTitle} style={{ textAlign: 'left' }}>
                Sign in to your account
              </h1>
              <p className={styles.logsigSubtitle} style={{ textAlign: 'left' }}>
                Welcome back! Enter your email and password to continue.
              </p>
            </div>

            {error && (
              <div className={styles.logsigError}>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className={styles.logsigSuccess}>
                <span>Signed in successfully! Redirecting to desk...</span>
              </div>
            )}

            <div className={styles.logsigField}>
              <label htmlFor="email" className={styles.logsigLabel}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                disabled={loading}
                className={styles.logsigInput}
              />
            </div>

            <div className={styles.logsigField}>
              <div className={styles.logsigLabelRow}>
                <label htmlFor="password" className={styles.logsigLabel}>
                  Password
                </label>
                <Link href="/forgot-password" className={styles.forgotLink}>
                  Forgot password?
                </Link>
              </div>
              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className={styles.passwordInput}
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

            <button
              type="submit"
              disabled={loading || !email || !password}
              className={styles.logsigButton}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className={styles.logsigLinks}>
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup">Create an account</Link>
            </div>
          </form>
        </div>

        <div className={styles.formTermsNotice}>
          By signing in, you agree to our <Link href="/about">Terms of Service</Link> and{' '}
          <Link href="/about">Privacy Policy</Link>.
        </div>
      </div>
    </div>
  );
}