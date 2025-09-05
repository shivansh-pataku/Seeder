// src/app/auth/signin/page.js - UPDATED VERSION
'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import styles from '../../Styles/logsig.module.css'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    console.log('NextAuth v5 Beta signin for:', email)

    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password.')
      }

      // Test providers API first
      const providersResponse = await fetch('/api/auth/providers')
      if (!providersResponse.ok) {
        console.error('Providers API error:', providersResponse.status)
        setError('Authentication service unavailable')
        return
      }

      const providers = await providersResponse.json()
      console.log('Providers available:', providers)

      // Attempt signin with NextAuth
      console.log('Calling NextAuth v5 signIn...')
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/'
      })

      console.log('SignIn result:', result)

      if (result?.error) {
        console.error('SignIn error:', result.error)
        if (result.error === 'CredentialsSignin') {
          setError('Invalid email or password')
        } else {
          setError(`Login failed: ${result.error}`)
        }
      } else if (result?.ok) {
        console.log('SignIn successful - redirecting')
        setSuccess(true)
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      } else {
        console.error('Unexpected result:', result)
        setError('Authentication failed')
      }
    } catch (error) {
      console.error('Signin exception:', error)
      setError(error.message || 'Network error - please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.logsigContainer}>
      <form onSubmit={handleSubmit} className={styles.logsigForm} autoComplete="off">
        <h1 className={styles.logsigTitle}>Sign In</h1>
        
        
        <div className={styles.logsigField}>
          <label htmlFor="email" className={styles.logsigLabel}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={loading}
            className={styles.logsigInput}
          />
        </div>
        
        <div className={styles.logsigField}>
          <label htmlFor="password" className={styles.logsigLabel}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={loading}
            className={styles.logsigInput}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className={styles.logsigButton}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        
        {error && (
          <div className={styles.logsigError}>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.logsigSuccess}>
            Login successful! Redirecting...
          </div>
        )}

        <div className={styles.logsigLinks}>
          <a href="#">Forgot password?</a>
          <span> | </span>
          <a href="/auth/signup">Create account</a>
        </div>
      </form>
    </div>
  )
}