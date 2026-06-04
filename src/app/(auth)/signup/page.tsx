'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
    } else {
      window.location.href = '/onboarding'
    }
  }

  const handleGoogleSignup = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className={styles.page}>
      {/* Background gradient orbs */}
      <div className={styles.bgOrbs} aria-hidden="true">
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>

      <div className={styles.container}>
        {/* Logo & Tagline */}
        <header className={styles.header}>
          <h1 className={styles.logo}>
            Grooming <span className={styles.logoAccent}>OS</span>
          </h1>
          <p className={styles.tagline}>Your AI Personal Stylist</p>
        </header>

        {/* Signup Form */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Create your account</h2>
          <p className={styles.cardSubtitle}>Start your personalized style journey</p>

          <form className={styles.form} onSubmit={handleSignup}>
            {error && <div className={styles.errorBanner}>{error}</div>}
            
            <div className={styles.field}>
              <label htmlFor="signup-name" className={styles.label}>
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                className={styles.input}
                placeholder="Your full name"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="signup-email" className={styles.label}>
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                className={styles.input}
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="signup-password" className={styles.label}>
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="signup-confirm-password" className={styles.label}>
                Confirm Password
              </label>
              <input
                id="signup-confirm-password"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button id="signup-submit" type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>



          {/* Sign In Link */}
          <p className={styles.switchText}>
            Already have an account?{' '}
            <Link id="signup-to-login" href="/login" className={styles.switchLink}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
