'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = '/home'
    }
  }

  const handleGoogleLogin = async () => {
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

        {/* Login Form */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Welcome back</h2>
          <p className={styles.cardSubtitle}>Sign in to continue your style journey</p>

          <form className={styles.form} onSubmit={handleLogin}>
            {error && <div className={styles.errorBanner}>{error}</div>}
            
            <div className={styles.field}>
              <label htmlFor="login-email" className={styles.label}>
                Email
              </label>
              <input
                id="login-email"
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
              <label htmlFor="login-password" className={styles.label}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button id="login-submit" type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          {/* <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>or continue with</span>
            <span className={styles.dividerLine} />
          </div> */}

          {/* Google Sign In */}
          {/* <button id="login-google" type="button" className={styles.googleBtn} onClick={handleGoogleLogin}>
            <span className={styles.googleIcon}>G</span>
            <span>Continue with Google</span>
          </button> */}

          {/* Sign Up Link */}
          <p className={styles.switchText}>
            Don&apos;t have an account?{' '}
            <Link id="login-to-signup" href="/signup" className={styles.switchLink}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
