'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'

export default function SettingsPage() {
  const router = useRouter()
  const [vtoEngine, setVtoEngine] = useState('openai')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('users').select('vto_engine').eq('id', user.id).single()
        if (data?.vto_engine) {
          setVtoEngine(data.vto_engine)
        }
      }
      setLoading(false)
    }
    loadSettings()
  }, [])

  const handleEngineChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEngine = e.target.value
    setVtoEngine(newEngine)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Best effort update, might fail if RLS prevents client updates to users table
      await supabase.from('users').update({ vto_engine: newEngine }).eq('id', user.id)
    }
  }

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
            <span className={styles.rowLabel}>VTO Engine</span>
            {!loading && (
              <select 
                value={vtoEngine} 
                onChange={handleEngineChange}
                style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '4px 8px' }}
              >
                <option value="openai">OpenAI (gpt-image-2)</option>
                <option value="gemini">Google (gemini-3-pro-image)</option>
              </select>
            )}
          </div>
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
