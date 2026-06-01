'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'

const POPULAR_OCCASIONS = [
  { id: 'dinner_date', label: 'Dinner Date', icon: '🍷' },
  { id: 'office', label: 'Office', icon: '💼' },
  { id: 'casual_friday', label: 'Casual Friday', icon: '☕' },
  { id: 'wedding', label: 'Wedding Guest', icon: '🎉' },
  { id: 'gym', label: 'Gym', icon: '🏋️' },
  { id: 'weekend', label: 'Weekend Errands', icon: '🛒' },
]

export default function DashboardHome() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [stats, setStats] = useState({ wardrobeCount: 0, outfitCount: 0, name: 'Explorer' })

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      
      const userId = session.user.id

      // Fetch user profile for name (optional)
      const { data: profile } = await supabase.from('users').select('full_name').eq('id', userId).single()

      // Fetch wardrobe count
      const { count: wCount } = await supabase.from('wardrobe_items').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true)
      
      // Fetch outfit count
      const { count: oCount } = await supabase.from('outfits').select('*', { count: 'exact', head: true }).eq('user_id', userId)

      setStats({
        name: profile?.full_name || session.user.email?.split('@')[0] || 'Explorer',
        wardrobeCount: wCount || 0,
        outfitCount: oCount || 0
      })
    }
    fetchStats()
  }, [])

  const handleStyleMe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    
    // Push to style page which handles the generation
    router.push(`/style?prompt=${encodeURIComponent(prompt)}`)
  }

  const handleOccasionClick = (occasionLabel: string) => {
    setPrompt(`Get me ready for a ${occasionLabel.toLowerCase()}`)
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.greeting}>
          <h1 className={styles.title}>Good evening, {stats.name}</h1>
          <p className={styles.subtitle}>What would you like to wear today?</p>
        </div>
        <div className={styles.avatar}>👤</div>
      </header>

      {/* Main Action - Get Me Ready */}
      <section className={styles.heroSection}>
        <div className={styles.heroCard}>
          <div className={styles.heroGlow} />
          <h2 className={styles.heroTitle}>✨ Get Me Ready</h2>
          
          <form onSubmit={handleStyleMe} className={styles.promptForm}>
            <input
              type="text"
              className={styles.promptInput}
              placeholder="Tell me the occasion or mood..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              type="submit"
              className={`${styles.styleButton} ${!prompt.trim() ? styles.styleButtonDisabled : ''}`}
              disabled={!prompt.trim()}
            >
              Style Me
            </button>
          </form>

          <div className={styles.occasionsGrid}>
            {POPULAR_OCCASIONS.map((occ) => (
              <button
                key={occ.id}
                type="button"
                className={styles.occasionPill}
                onClick={() => handleOccasionClick(occ.label)}
              >
                <span>{occ.icon}</span> {occ.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className={styles.statsSection}>
        <div className={styles.statsScroll}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>👔</span>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.wardrobeCount}</span>
              <span className={styles.statLabel}>Wardrobe Items</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>✨</span>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.outfitCount}</span>
              <span className={styles.statLabel}>Outfits Styled</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📊</span>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>8.5</span>
              <span className={styles.statLabel}>Style Score</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className={styles.quickActionsSection}>
        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.actionsGrid}>
          <Link href="/wardrobe/add" className={styles.actionCard}>
            <div className={styles.actionIconWrapper}>
              <span className={styles.actionIcon}>📸</span>
            </div>
            <span className={styles.actionLabel}>Add to Wardrobe</span>
          </Link>
          <Link href="/groom" className={styles.actionCard}>
            <div className={styles.actionIconWrapper}>
              <span className={styles.actionIcon}>💇</span>
            </div>
            <span className={styles.actionLabel}>Grooming Tips</span>
          </Link>
          <Link href="/style/marketplace" className={styles.actionCard}>
            <div className={styles.actionIconWrapper}>
              <span className={styles.actionIcon}>🛒</span>
            </div>
            <span className={styles.actionLabel}>Smart Shop</span>
          </Link>
          <Link href="/style/saved" className={styles.actionCard}>
            <div className={styles.actionIconWrapper}>
              <span className={styles.actionIcon}>📋</span>
            </div>
            <span className={styles.actionLabel}>My Looks</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
