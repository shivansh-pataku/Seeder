'use client'
import { useState } from 'react'
import styles from '../Styles/logsig.module.css'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API request to send reset email
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 1500)
  }

  return (
    <div className={styles.logsigContainer}>
      <form onSubmit={handleSubmit} className={styles.logsigForm} autoComplete="off">
        <h1 className={styles.logsigTitle}>Reset Password</h1>
        
        {submitted ? (
          <div className={styles.logsigSuccess} style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            📬 An email has been sent to <strong>{email}</strong> with instructions to reset your password.
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center', fontFamily: 'var(--font-readexpro)' }}>
              Enter the email address associated with your Seeder account, and we will send you a link to reset your password.
            </p>
            
            <div className={styles.logsigField}>
              <label htmlFor="email" className={styles.logsigLabel}>Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                disabled={loading}
                className={styles.logsigInput}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading || !email}
              className={styles.logsigButton}
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </>
        )}

        <div className={styles.logsigLinks}>
          <Link href="/auth/signin">Back to Sign In</Link>
        </div>
      </form>
    </div>
  )
}
