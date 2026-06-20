'use client'

import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { User, Settings, Lock, Bell, Gem, HelpCircle, LogOut } from 'lucide-react'
import styles from './page.module.css'

import { useState, useEffect } from 'react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      
      const userId = session.user.id
      
      const { data: userRow } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
      const { data: stylePrefs } = await supabase.from('style_preferences').select('*').eq('user_id', userId).maybeSingle()
      
      setProfile({
        name: userRow?.full_name || 'Style Explorer',
        memberSince: userRow?.created_at ? new Date(userRow.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently',
        archetype: stylePrefs?.style_archetype || 'Not completed yet',
        bodyType: 'Not completed yet',
        stats: {
          wardrobe: 0,
          outfits: 0,
          saved: 0
        }
      })
    }
    loadData()
  }, [])

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
          <div className={styles.avatar}><User size={32} color="#1E1E24" /></div>
          <div className={styles.userInfo}>
            <h1 className={styles.name}>{profile?.name || 'Loading...'}</h1>
            <span className={styles.memberSince}>Member since {profile?.memberSince || '...'}</span>
          </div>
        </div>
        <button className={styles.editBtn}>Edit</button>
      </header>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{profile?.stats.wardrobe || 0}</span>
          <span className={styles.statLabel}>Items</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{profile?.stats.outfits || 0}</span>
          <span className={styles.statLabel}>Generated</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{profile?.stats.saved || 0}</span>
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
              <div className={styles.cardValue}>{profile?.archetype || '...'}</div>
            </div>
            <Link href="/onboarding/style-quiz?retake=true" className={styles.textBtn} style={{ textDecoration: 'none' }}>
              Retake Quiz
            </Link>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Body Profile</h2>
          <Link href="/profile/body" className={styles.textBtn} style={{ textDecoration: 'none' }}>
            View Details & Rescan
          </Link>
        </div>
        
        <div className={styles.glassCard}>
          <div className={styles.cardRow}>
            <div>
              <div className={styles.cardLabel}>Body Type</div>
              <div className={styles.cardValue}>{profile?.bodyType || '...'}</div>
            </div>
            <Link href="/onboarding/body-scan" className={styles.textBtn} style={{ textDecoration: 'none' }}>
              Rescan
            </Link>
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
            <span className={styles.settingsIcon}><Settings size={20} /></span> Account Settings
          </Link>
          <button className={styles.settingsItem}>
            <span className={styles.settingsIcon}><Lock size={20} /></span> Privacy & Data
          </button>
          <button className={styles.settingsItem}>
            <span className={styles.settingsIcon}><Bell size={20} /></span> Notifications
          </button>
          <button className={styles.settingsItem}>
            <span className={styles.settingsIcon}><Gem size={20} /></span> Subscription
          </button>
          <button className={styles.settingsItem}>
            <span className={styles.settingsIcon}><HelpCircle size={20} /></span> Help & Support
          </button>
          <button className={`${styles.settingsItem} ${styles.logoutItem}`} onClick={handleLogout}>
            <span className={styles.settingsIcon}><LogOut size={20} /></span> Log Out
          </button>
        </div>
      </section>
    </div>
  )
}
