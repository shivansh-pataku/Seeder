// src/app/signup/page.js
'use client'
import React, { useState } from "react"
import styles from "../../Styles/logsig.module.css"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault() // Prevent form reload
    setError(null)
    setLoading(true)
    setSuccess(false)

    console.log('📝 Signup attempt for:', email)

    try {
      // Validation
      if (!name || !email || !password || !confirmPassword) {
        throw new Error("Please fill in all fields")
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match")
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long")
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error("Please enter a valid email address")
      }

      console.log('🔄 Sending signup request...')
      
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: name,
          email,
          password,
        }),
      })

      const data = await res.json()
      console.log('📋 Signup response:', data)

      if (!res.ok) {
        throw new Error(data.error || data.message || "Signup failed")
      }

      console.log('✅ Signup successful')
      setSuccess(true)
      
      // Redirect to signin page after success
      setTimeout(() => {
        router.push("/auth/signin")
      }, 1500)

    } catch (err) {
      console.error('❌ Signup error:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className={styles.logsigContainer}>
        <form className={styles.logsigForm} onSubmit={handleSubmit} autoComplete="off">
          <h2 className={styles.logsigTitle}>Create Account</h2>

          
          <div className={styles.logsigField}>
            <label htmlFor="username" className={styles.logsigLabel}>
              Username
            </label>
            <input 
              id="username" 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={loading}
              className={styles.logsigInput}
              autoComplete="username"
            /> 
          </div>

          <div className={styles.logsigField}>
            <label htmlFor="email" className={styles.logsigLabel}>
              Email
            </label>
            <input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
              className={styles.logsigInput}
              autoComplete="email"
            />
          </div>

          <div className={styles.logsigField}>
            <label htmlFor="password" className={styles.logsigLabel}>
              Password
            </label>
            <input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password (min 6 characters)"
              required
              disabled={loading}
              className={styles.logsigInput}
              autoComplete="new-password"
            />
          </div>

          <div className={styles.logsigField}>
            <label htmlFor="confirm-password" className={styles.logsigLabel}>
              Confirm Password
            </label>
            <input 
              id="confirm-password" 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              disabled={loading}
              className={styles.logsigInput}
              autoComplete="new-password"
            />
          </div>

          <button 
            className={styles.logsigButton} 
            type="submit" 
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
          
          {error && (
            <div className={styles.logsigError}>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.logsigSuccess}>
              Account created successfully! Redirecting to sign in...
            </div>
          )}
          
          <div className={styles.logsigLinks}>
            Already have an account? <a href="/auth/signin">Sign in</a>
          </div>
        </form>
      </div>
    </>
  )
}