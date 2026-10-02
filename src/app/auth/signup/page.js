'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../Styles/logsig.module.css';
import AuthBrandPanel from '../../Components/AuthBrandPanel';
import { Eye, EyeSlash } from '@phosphor-icons/react';

export default function SignupPage() {
  const router = useRouter();

  // Wizard Steps: 'EMAIL' -> 'OTP' -> 'PROFILE'
  const [step, setStep] = useState('EMAIL');

  // Form Fields
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // OTP Timer
  const [resendCooldown, setResendCooldown] = useState(0);

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState(null); // { checking: bool, available: bool, message: string }
  const usernameDebounceRef = useRef(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Debounced username availability check
  useEffect(() => {
    if (step !== 'PROFILE') return;

    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameStatus(null);
      return;
    }

    if (trimmed.length < 3) {
      setUsernameStatus({ checking: false, available: false, message: 'Must be at least 3 characters' });
      return;
    }

    setUsernameStatus({ checking: true, available: null, message: 'Checking availability...' });

    if (usernameDebounceRef.current) {
      clearTimeout(usernameDebounceRef.current);
    }

    usernameDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/signup/check-username?username=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (data.available) {
          setUsernameStatus({ checking: false, available: true, message: 'Username is available' });
        } else {
          setUsernameStatus({ checking: false, available: false, message: data.error || 'Username is taken' });
        }
      } catch {
        setUsernameStatus({ checking: false, available: false, message: 'Unable to check availability' });
      }
    }, 350);

    return () => {
      if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
    };
  }, [username, step]);

  // Password strength calculator
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strengthScore = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
  const isPasswordStrong = strengthScore === 4;
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  // -------------------------------------------------------------
  // STEP 1: Submit Email -> Send OTP
  // -------------------------------------------------------------
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setStep('OTP');
      setResendCooldown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 2: Verify OTP
  // -------------------------------------------------------------
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setVerificationToken(data.verificationToken);
      setStep('PROFILE');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend code');

      setResendCooldown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 3: Complete Profile
  // -------------------------------------------------------------
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!usernameStatus?.available) {
      setError('Please choose an available username');
      return;
    }

    if (!isPasswordStrong) {
      setError('Password does not meet the security requirements');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationToken,
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create account');
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

  return (
    <div className={styles.splitPage}>
      {/* LEFT SIDE: Brand Showcase & Geometric Artwork */}
      <AuthBrandPanel
        tagline="Create your account to start writing."
        subtext="Draft distraction-free stories, structure your thoughts with AI, and publish directly to the world."
      />

      {/* RIGHT SIDE: Single-Page Multi-Step Authentication Form */}
      <div className={styles.formSide}>
        <div className={styles.formTopLogo}>
          <Link href="/" className={styles.brandLogoMark}>
            {/* Future Logo Image Placeholder: */}
            {/* <Image src="/logo.png" alt="Meridian Logo" width={32} height={32} priority /> */}
            <span>Meridian</span>
          </Link>
        </div>

        <div className={styles.formContentWrapper}>
          {/* Progress Indicator */}
          <div className={styles.stepIndicator}>
            <div className={`${styles.stepDot} ${styles.stepDotActive}`} />
            <div className={`${styles.stepDot} ${step === 'OTP' || step === 'PROFILE' ? styles.stepDotActive : ''}`} />
            <div className={`${styles.stepDot} ${step === 'PROFILE' ? styles.stepDotActive : ''}`} />
          </div>

          {/* Feedback messages */}
          {error && (
            <div className={styles.logsigError}>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className={styles.logsigSuccess}>
              <span>Account created successfully! Redirecting to sign in...</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 1: EMAIL INPUT                                           */}
          {/* ============================================================== */}
          {step === 'EMAIL' && (
            <form onSubmit={handleEmailSubmit} autoComplete="off">
              <div className={styles.logsigHeader} style={{ textAlign: 'left' }}>
                <h1 className={styles.logsigTitle} style={{ textAlign: 'left' }}>
                  Create your account
                </h1>
                <p className={styles.logsigSubtitle} style={{ textAlign: 'left' }}>
                  Enter your email to receive a secure verification code
                </p>
              </div>

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
                    <span>Sending code...</span>
                  </>
                ) : (
                  'Continue with Email'
                )}
              </button>

              <div className={styles.logsigLinks}>
                Already have an account?{' '}
                <Link href="/auth/signin">Sign in</Link>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* STEP 2: 6-DIGIT OTP ENTRY                                     */}
          {/* ============================================================== */}
          {step === 'OTP' && (
            <form onSubmit={handleOtpSubmit} autoComplete="off">
              <div className={styles.logsigHeader} style={{ textAlign: 'left' }}>
                <h1 className={styles.logsigTitle} style={{ textAlign: 'left' }}>
                  Verify your email
                </h1>
                <p className={styles.logsigSubtitle} style={{ textAlign: 'left' }}>
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
              </div>

              <div className={styles.logsigField}>
                <label htmlFor="otp" className={styles.logsigLabel}>
                  6-Digit Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtp(val);
                    if (error) setError('');
                  }}
                  placeholder="••••••"
                  required
                  disabled={loading}
                  className={`${styles.logsigInput} ${styles.otpInput}`}
                  autoFocus
                />

                <div className={styles.otpActionsRow}>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('EMAIL');
                      setError('');
                    }}
                    className={styles.otpResendBtn}
                    style={{ textDecoration: 'none', color: 'var(--task-editor-text-muted)' }}
                  >
                    &larr; Change email
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={handleResendOtp}
                    className={styles.otpResendBtn}
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className={styles.logsigButton}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    <span>Verifying code...</span>
                  </>
                ) : (
                  'Verify Code & Continue'
                )}
              </button>

              <div className={styles.logsigLinks}>
                Already have an account?{' '}
                <Link href="/auth/signin">Sign in</Link>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* STEP 3: USERNAME & STRONG PASSWORD                            */}
          {/* ============================================================== */}
          {step === 'PROFILE' && (
            <form onSubmit={handleProfileSubmit} autoComplete="off">
              <div className={styles.logsigHeader} style={{ textAlign: 'left' }}>
                <h1 className={styles.logsigTitle} style={{ textAlign: 'left' }}>
                  Complete your profile
                </h1>
                <p className={styles.logsigSubtitle} style={{ textAlign: 'left' }}>
                  Choose your author handle and create a secure password
                </p>
              </div>

              {/* Username Input with live uniqueness check */}
              <div className={styles.logsigField}>
                <label htmlFor="username" className={styles.logsigLabel}>
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="e.g. alex_writer"
                  required
                  disabled={loading || success}
                  className={styles.logsigInput}
                  autoComplete="username"
                  autoFocus
                />
                {usernameStatus && (
                  <div
                    className={`${styles.usernameBadge} ${usernameStatus.checking
                        ? styles.badgeChecking
                        : usernameStatus.available
                          ? styles.badgeSuccess
                          : styles.badgeError
                      }`}
                  >
                    <span>
                      {usernameStatus.checking
                        ? '• '
                        : usernameStatus.available
                          ? '✓ '
                          : '✗ '}
                    </span>
                    <span>{usernameStatus.message}</span>
                  </div>
                )}
              </div>

              {/* Password Input with strength meter */}
              <div className={styles.logsigField}>
                <label htmlFor="password" className={styles.logsigLabel}>
                  Create Password
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    disabled={loading || success}
                    className={styles.passwordInput}
                    autoComplete="new-password"
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

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div className={styles.strengthContainer}>
                    <div className={styles.strengthBars}>
                      <div
                        className={`${styles.strengthBar} ${strengthScore >= 1 ? (strengthScore <= 2 ? styles.strengthWeak : strengthScore === 3 ? styles.strengthMedium : styles.strengthStrong) : ''
                          }`}
                      />
                      <div
                        className={`${styles.strengthBar} ${strengthScore >= 2 ? (strengthScore <= 2 ? styles.strengthWeak : strengthScore === 3 ? styles.strengthMedium : styles.strengthStrong) : ''
                          }`}
                      />
                      <div
                        className={`${styles.strengthBar} ${strengthScore >= 3 ? (strengthScore === 3 ? styles.strengthMedium : styles.strengthStrong) : ''
                          }`}
                      />
                      <div
                        className={`${styles.strengthBar} ${strengthScore === 4 ? styles.strengthStrong : ''
                          }`}
                      />
                    </div>
                    <div className={styles.strengthText}>
                      <span>
                        Strength:{' '}
                        <strong>
                          {strengthScore <= 1
                            ? 'Too weak'
                            : strengthScore === 2
                              ? 'Weak'
                              : strengthScore === 3
                                ? 'Medium'
                                : 'Strong'}
                        </strong>
                      </span>
                      <span style={{ fontSize: '0.7rem' }}>
                        {[
                          !hasMinLength && '8+ chars',
                          !hasUppercase && 'uppercase',
                          !hasNumber && 'number',
                          !hasSpecial && 'symbol',
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className={styles.logsigField}>
                <label htmlFor="confirmPassword" className={styles.logsigLabel}>
                  Confirm Password
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
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
                disabled={
                  loading ||
                  !usernameStatus?.available ||
                  !isPasswordStrong ||
                  !passwordsMatch ||
                  success
                }
                className={styles.logsigButton}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    <span>Creating your profile...</span>
                  </>
                ) : (
                  'Create Account'
                )}
              </button>

              <div className={styles.logsigLinks}>
                Already have an account?{' '}
                <Link href="/auth/signin">Sign in</Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer Disclaimer */}
        <div className={styles.formTermsNotice}>
          By signing up, you agree to our <Link href="/about">Terms of Service</Link> and{' '}
          <Link href="/about">Privacy Policy</Link>.
        </div>
      </div>
    </div>
  );
}