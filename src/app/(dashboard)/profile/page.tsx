'use client'

import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'

const MOCK_PROFILE = {
  name: 'Style Explorer',
  memberSince: 'May 2026',
  archetype: 'Smart Casual ✨',
  bodyType: 'Mesomorph',
  stats: {
    wardrobe: 12,
    outfits: 3,
    saved: 2
  }
}

export default function ProfilePage() {
  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (err) {
      console.error('Logout error', err)
    }
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>👤</div>
          <div className={styles.userInfo}>
            <h1 className={styles.name}>{MOCK_PROFILE.name}</h1>
            <span className={styles.memberSince}>Member since {MOCK_PROFILE.memberSince}</span>
          </div>
        </div>
        <button className={styles.editBtn}>Edit</button>
      </header>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{MOCK_PROFILE.stats.wardrobe}</span>
          <span className={styles.statLabel}>Items</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{MOCK_PROFILE.stats.outfits}</span>
          <span className={styles.statLabel}>Generated</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{MOCK_PROFILE.stats.saved}</span>
          <span className={styles.statLabel}>Saved</span>
        </div>
      </div>

      {/* Style Profile */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Style Profile</h2>
        
        <div className={styles.glassCard}>
          <div className={styles.cardRow}>
            <div>
              <div className={styles.cardLabel}>Archetype</div>
              <div className={styles.cardValue}>{MOCK_PROFILE.archetype}</div>
            </div>
            <button className={styles.textBtn}>Retake Quiz</button>
          </div>
          
          <div className={styles.divider} />
          
          <div>
            <div className={styles.cardLabel}>Color Palette</div>
            <div className={styles.colorSwatches}>
              <div className={styles.swatch} style={{ background: '#1B3A4B' }} />
              <div className={styles.swatch} style={{ background: '#F5E6C8' }} />
              <div className={styles.swatch} style={{ background: '#8B7355' }} />
              <div className={styles.swatch} style={{ background: '#2C4A3E' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Body Profile */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Body Profile</h2>
        
        <div className={styles.glassCard}>
          <div className={styles.cardRow}>
            <div>
              <div className={styles.cardLabel}>Body Type</div>
              <div className={styles.cardValue}>{MOCK_PROFILE.bodyType}</div>
            </div>
            <button className={styles.textBtn}>Rescan</button>
          </div>
          
          <div className={styles.divider} />
          
          <p className={styles.cardDesc}>
            Athletic build with broad shoulders. Regular fits work best to showcase your natural physique.
          </p>
        </div>
      </section>

      {/* Settings Links */}
      <section className={styles.section}>
        <div className={styles.settingsList}>
          <Link href="/profile/settings" className={styles.settingsItem}>
            <span className={styles.settingsIcon}>⚙️</span> Account Settings
          </Link>
          <button className={styles.settingsItem}>
            <span className={styles.settingsIcon}>🔒</span> Privacy & Data
          </button>
          <button className={styles.settingsItem}>
            <span className={styles.settingsIcon}>🔔</span> Notifications
          </button>
          <button className={styles.settingsItem}>
            <span className={styles.settingsIcon}>💎</span> Subscription
          </button>
          <button className={styles.settingsItem}>
            <span className={styles.settingsIcon}>❓</span> Help & Support
          </button>
          <button className={`${styles.settingsItem} ${styles.logoutItem}`} onClick={handleLogout}>
            <span className={styles.settingsIcon}>🚪</span> Log Out
          </button>
        </div>
      </section>
    </div>
  )
}
