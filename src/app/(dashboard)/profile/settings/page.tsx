'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'

export default function SettingsPage() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/profile" className={styles.backBtn}>←</Link>
        <h1 className={styles.title}>Settings</h1>
      </header>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Account</h2>
        <div className={styles.card}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Email</span>
            <span className={styles.rowValue}>user@example.com</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Subscription</span>
            <span className={styles.rowValue}>Pro (₹999/mo)</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Preferences</h2>
        <div className={styles.card}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Notifications</span>
            <span className={styles.rowArrow}>→</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Privacy & Data</span>
            <span className={styles.rowArrow}>→</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Theme</span>
            <span className={styles.rowValue}>Dark Mode</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Danger Zone</h2>
        <div className={styles.card}>
          <button className={styles.dangerBtn} onClick={handleLogout}>
            Log Out
          </button>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} />
          <button className={styles.dangerBtn}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
