import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import styles from './page.module.css'

export default async function BodyAnalysisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('body_profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/profile" className={styles.backBtn}>←</Link>
        <h1 className={styles.title}>Body Analysis</h1>
      </header>

      {!profile ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-gray-400)' }}>
          <p style={{ marginBottom: '16px' }}>No body scan profile found.</p>
          <Link href="/onboarding/body-scan" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '500' }}>
            Take Body Scan →
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.visualContainer}>
            {profile.front_photo_url ? (
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 16px', border: '2px solid var(--color-border)' }}>
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={profile.front_photo_url} alt="Front View" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div className={styles.bodyIcon}>🧍</div>
            )}
            <div className={styles.bodyType}>{profile.body_type}</div>
            <p style={{ color: 'var(--color-gray-400)', marginTop: '8px', fontSize: '14px', textTransform: 'capitalize' }}>
              {profile.height_estimate} | {profile.build} Build
            </p>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Measurements & Proportions</h2>
            <div className={styles.metricGrid}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Shoulder Width</span>
                <span className={styles.metricValue}>{profile.shoulder_width}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Torso Ratio</span>
                <span className={styles.metricValue}>{profile.torso_ratio}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Build</span>
                <span className={styles.metricValue}>{profile.build}</span>
              </div>
              {profile.raw_analysis?.shoulder_to_hip && (
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Shape</span>
                  <span className={styles.metricValue}>{profile.raw_analysis.shoulder_to_hip}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Fit Recommendations</h2>
            <div className={styles.metricGrid}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Tops</span>
                <span className={styles.metricValue}>{profile.fit_recommendations?.top_fit || 'Regular'}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Bottoms</span>
                <span className={styles.metricValue}>{profile.fit_recommendations?.bottom_fit || 'Regular'}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Outerwear</span>
                <span className={styles.metricValue}>{profile.fit_recommendations?.outerwear_fit || 'Regular'}</span>
              </div>
            </div>
          </div>

          {profile.raw_analysis?.style_tips && profile.raw_analysis.style_tips.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Style Advice</h2>
              <div className={styles.adviceList}>
                {profile.raw_analysis.style_tips.map((tip: string, idx: number) => (
                  <div key={idx} className={styles.adviceItem} style={{ marginBottom: '12px' }}>
                    <span className={styles.adviceIcon}>✨</span>
                    <span className={styles.adviceText}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '24px', padding: '0 16px' }}>
            <Link 
              href="/onboarding/body-scan" 
              style={{ 
                display: 'block', 
                width: '100%', 
                padding: '16px', 
                background: 'var(--color-bg-hover)', 
                color: 'var(--color-text)', 
                textAlign: 'center', 
                borderRadius: '12px', 
                textDecoration: 'none',
                fontWeight: '500',
                border: '1px solid var(--color-border)'
              }}
            >
              Rescan Body
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
