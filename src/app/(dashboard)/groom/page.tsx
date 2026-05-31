'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'

interface FaceProfile {
  face_shape: string
  skin_tone: string
  hair_type: string
  hair_texture: string
  facial_hair_status: string
  wears_glasses: boolean
  color_palette: any
  raw_analysis: any
  analyzed_at: string
}

interface Recommendation {
  id: string
  category: string
  title: string
  description: string
  reasoning: string
  confidence_score: number
}

export default function GroomPage() {
  const [faceProfile, setFaceProfile] = useState<FaceProfile | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) {
        setLoading(false)
        return
      }
      const userId = userData.user.id

      // Fetch face profile
      const { data: faceData } = await supabase
        .from('face_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .single()

      if (faceData) setFaceProfile(faceData)

      // Fetch grooming recommendations
      const { data: recData } = await supabase
        .from('grooming_recommendations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (recData) setRecommendations(recData)

      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        Loading your profile...
      </div>
    )
  }

  // No face profile — show onboarding CTA
  if (!faceProfile) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Grooming Intelligence</h1>
          <p className={styles.subtitle}>Personalized to your face and features</p>
        </header>

        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🧑‍🔬</div>
          <h2 className={styles.emptyTitle}>No Face Scan Yet</h2>
          <p className={styles.emptyText}>
            Take a quick selfie and our AI will analyze your face shape, skin tone, and features to give you personalized grooming recommendations.
          </p>
          <Link href="/groom/scan" className={styles.scanCta}>
            Start Face Scan
            <span>→</span>
          </Link>
        </div>
      </div>
    )
  }

  // Extract enriched data from raw_analysis
  const raw = faceProfile.raw_analysis || {}
  const colorPalette = faceProfile.color_palette || {}

  // Group recommendations by category
  const hairstyles = recommendations.filter(r => r.category === 'Hairstyle')
  const facialHair = recommendations.filter(r => r.category === 'Facial Hair')
  const glasses = recommendations.filter(r => r.category === 'Glasses')
  const skincare = recommendations.find(r => r.category === 'Skincare')
  const eyebrows = recommendations.find(r => r.category === 'Eyebrow Grooming')

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Grooming Intelligence</h1>
        <p className={styles.subtitle}>Personalized to your face and features</p>
      </header>

      {/* Face Analysis Summary */}
      <section className={styles.faceCard}>
        <div className={styles.glow} />
        <div className={styles.faceHeader}>
          <h3>Your Features</h3>
          <Link href="/groom/scan" className={styles.editBtn}>Retake Scan</Link>
        </div>
        <div className={styles.faceGrid}>
          <div className={styles.faceStat}>
            <span className={styles.statIcon}>👱</span>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Face Shape</span>
              <span className={styles.statValue}>{raw.face_shape || faceProfile.face_shape}</span>
            </div>
          </div>
          <div className={styles.faceStat}>
            <span className={styles.statIcon}>🎨</span>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Skin Tone</span>
              <span className={styles.statValue}>{raw.skin_tone || faceProfile.skin_tone}</span>
            </div>
          </div>
          <div className={styles.faceStat}>
            <span className={styles.statIcon}>🌡️</span>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Undertone</span>
              <span className={styles.statValue}>{raw.undertone || 'Unknown'}</span>
            </div>
          </div>
          <div className={styles.faceStat}>
            <span className={styles.statIcon}>💪</span>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Jawline</span>
              <span className={styles.statValue}>{raw.jawline || 'Unknown'}</span>
            </div>
          </div>
          <div className={styles.faceStat}>
            <span className={styles.statIcon}>💇‍♂️</span>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Hair Type</span>
              <span className={styles.statValue}>{faceProfile.hair_type}</span>
            </div>
          </div>
          <div className={styles.faceStat}>
            <span className={styles.statIcon}>👁️</span>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Eye Shape</span>
              <span className={styles.statValue}>{raw.eye_shape || 'Unknown'}</span>
            </div>
          </div>
          <div className={styles.faceStat}>
            <span className={styles.statIcon}>🧔</span>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Facial Hair</span>
              <span className={styles.statValue}>{faceProfile.facial_hair_status}</span>
            </div>
          </div>
          <div className={styles.faceStat}>
            <span className={styles.statIcon}>🌺</span>
            <div className={styles.statInfo}>
              <span className={styles.statLabel}>Color Season</span>
              <span className={styles.statValue}>{colorPalette.season || raw.color_season || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Color Palette */}
      {(colorPalette.best_colors?.length > 0 || raw.best_colors?.length > 0) && (
        <section className={styles.paletteSection}>
          <h3 className={styles.sectionTitle}>🎨 Your Color Palette</h3>
          <div className={styles.paletteCard}>
            <div className={styles.paletteRow}>
              <span className={styles.paletteLabel}>Best Colors</span>
              <div className={styles.chipRow}>
                {(colorPalette.best_colors || raw.best_colors || []).map((c: string, i: number) => (
                  <span key={i} className={styles.chipGood}>{c}</span>
                ))}
              </div>
            </div>
            {(colorPalette.avoid_colors?.length > 0 || raw.avoid_colors?.length > 0) && (
              <div className={styles.paletteRow}>
                <span className={styles.paletteLabel}>Avoid</span>
                <div className={styles.chipRow}>
                  {(colorPalette.avoid_colors || raw.avoid_colors || []).map((c: string, i: number) => (
                    <span key={i} className={styles.chipBad}>{c}</span>
                  ))}
                </div>
              </div>
            )}
            {(colorPalette.metal_preference || raw.metal_preference) && (
              <div className={styles.paletteRow}>
                <span className={styles.paletteLabel}>Accessories</span>
                <span className={styles.chipGood}>{colorPalette.metal_preference || raw.metal_preference}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className={styles.recommendationsList}>
          {/* Hairstyles */}
          {hairstyles.length > 0 && (
            <section className={styles.recSection}>
              <h3 className={styles.sectionTitle}>💇‍♂️ Hairstyles</h3>
              <div className={styles.scrollRow}>
                {hairstyles.map((rec) => (
                  <RecCard key={rec.id} rec={rec} emoji="✂️" />
                ))}
              </div>
            </section>
          )}

          {/* Facial Hair */}
          {facialHair.length > 0 && (
            <section className={styles.recSection}>
              <h3 className={styles.sectionTitle}>🧔 Facial Hair</h3>
              <div className={styles.scrollRow}>
                {facialHair.map((rec) => (
                  <RecCard key={rec.id} rec={rec} emoji="🪒" />
                ))}
              </div>
            </section>
          )}

          {/* Glasses */}
          {glasses.length > 0 && (
            <section className={styles.recSection}>
              <h3 className={styles.sectionTitle}>👓 Eyewear</h3>
              <div className={styles.scrollRow}>
                {glasses.map((rec) => (
                  <RecCard key={rec.id} rec={rec} emoji="🕶️" />
                ))}
              </div>
            </section>
          )}

          {/* Skincare */}
          {skincare && (
            <section className={styles.recSection}>
              <h3 className={styles.sectionTitle}>🧴 Skincare</h3>
              <div className={styles.infoCard}>
                <h4>{skincare.title}</h4>
                <p>{skincare.description}</p>
                <span className={styles.infoReasoning}>{skincare.reasoning}</span>
              </div>
            </section>
          )}

          {/* Eyebrows */}
          {eyebrows && (
            <section className={styles.recSection}>
              <h3 className={styles.sectionTitle}>🧹 Eyebrow Grooming</h3>
              <div className={styles.infoCard}>
                <h4>{eyebrows.title}</h4>
                <p>{eyebrows.description}</p>
                <span className={styles.infoReasoning}>{eyebrows.reasoning}</span>
              </div>
            </section>
          )}
        </div>
      )}

      {/* No recommendations yet but have profile */}
      {recommendations.length === 0 && (
        <div className={styles.noRecs}>
          <p>Your face scan is complete but recommendations haven't been generated yet.</p>
          <Link href="/groom/scan" className={styles.scanCta}>
            Regenerate Recommendations
            <span>→</span>
          </Link>
        </div>
      )}
    </div>
  )
}

function RecCard({ rec, emoji }: { rec: Recommendation; emoji: string }) {
  return (
    <div className={styles.recCard}>
      <div className={styles.recVisual}>
        <div className={styles.placeholderImg}>{emoji}</div>
        <div className={styles.confidenceBadge}>
          {Math.round(rec.confidence_score * 100)}% Match
        </div>
      </div>
      <div className={styles.recInfo}>
        <h4>{rec.title}</h4>
        <p>{rec.reasoning || rec.description}</p>
      </div>
    </div>
  )
}
