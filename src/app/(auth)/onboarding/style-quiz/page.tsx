'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { STYLE_ARCHETYPES } from '@/lib/constants/body-types'
import { X, Heart, Sparkles } from 'lucide-react'
import styles from './page.module.css'

// Style quiz looks — each represents a style archetype
const STYLE_LOOKS = [
  {
    id: 1,
    archetype: 'minimalist',
    title: 'Clean & Minimal',
    description: 'Neutral tones, tailored fits, zero clutter',
    colors: ['#f5f0eb', '#2d2d2d', '#8b8680', '#e8e0d8'],
  },
  {
    id: 2,
    archetype: 'old_money',
    title: 'Old Money Elegance',
    description: 'Preppy, timeless, quietly luxurious',
    colors: ['#1b3a4b', '#f5e6c8', '#8b7355', '#2c4a3e'],
  },
  {
    id: 3,
    archetype: 'streetwear',
    title: 'Urban Streetwear',
    description: 'Bold graphics, oversized fits, statement pieces',
    colors: ['#1a1a1a', '#ff4444', '#f5f5f5', '#444444'],
  },
  {
    id: 4,
    archetype: 'smart_casual',
    title: 'Smart Casual',
    description: 'Polished yet relaxed, the perfect balance',
    colors: ['#2c3e50', '#ecf0f1', '#c8a55a', '#7f8c8d'],
  },
  {
    id: 5,
    archetype: 'classic',
    title: 'Classic Tailored',
    description: 'Structured, refined, investment dressing',
    colors: ['#1c1c1e', '#4a4a4a', '#d4af37', '#2c2c2e'],
  },
  {
    id: 6,
    archetype: 'ethnic_modern',
    title: 'Ethnic Modern',
    description: 'Traditional meets contemporary',
    colors: ['#8b0000', '#ffd700', '#f5f0e8', '#4a2c2a'],
  },
  {
    id: 7,
    archetype: 'athleisure',
    title: 'Athleisure',
    description: 'Sport-inspired, functional fashion',
    colors: ['#1a1a2e', '#16213e', '#0f3460', '#e94560'],
  },
  {
    id: 8,
    archetype: 'rugged',
    title: 'Rugged & Raw',
    description: 'Workwear, durable, masculine edge',
    colors: ['#3e2723', '#5d4037', '#8d6e63', '#d7ccc8'],
  },
]

export default function StyleQuizPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [liked, setLiked] = useState<string[]>([])
  const [disliked, setDisliked] = useState<string[]>([])
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)

  const currentLook = STYLE_LOOKS[currentIndex]
  const isFinished = currentIndex >= STYLE_LOOKS.length

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isFinished) return

    setSwipeDirection(direction)
    
    if (direction === 'right') {
      setLiked((prev) => [...prev, currentLook.archetype])
    } else {
      setDisliked((prev) => [...prev, currentLook.archetype])
    }

    setTimeout(() => {
      setSwipeDirection(null)
      setCurrentIndex((prev) => prev + 1)
    }, 300)
  }

  const handleContinue = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      const dominantStyleVal = liked.length > 0 ? liked[0] : 'Minimalist'

      // Check if preferences already exist
      const { data: existing } = await supabase
        .from('style_preferences')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (existing) {
        await supabase.from('style_preferences').update({
          liked_looks: liked,
          disliked_looks: disliked,
          style_archetype: dominantStyleVal,
        }).eq('id', existing.id)
      } else {
        await supabase.from('style_preferences').insert({
          user_id: session.user.id,
          liked_looks: liked,
          disliked_looks: disliked,
          style_archetype: dominantStyleVal,
        })
      }
      const isRetake = typeof window !== 'undefined' && window.location.search.includes('retake=true')
      
      if (isRetake) {
        router.push('/profile')
      } else {
        router.push('/onboarding/body-scan')
      }
    } catch (err) {
      console.error('Failed to save style preferences:', err)
      
      const isRetake = typeof window !== 'undefined' && window.location.search.includes('retake=true')
      if (isRetake) {
        router.push('/profile')
      } else {
        router.push('/onboarding/body-scan')
      }
    }
  }

  // Determine dominant style from likes
  const dominantStyle = liked.length > 0
    ? STYLE_ARCHETYPES[liked[0] as keyof typeof STYLE_ARCHETYPES]
    : null

  return (
    <div className={styles.container}>
      <div className={styles.bgOrb1} />

      <div className={styles.content}>
        {/* Progress */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: '40%' }} />
        </div>
        <p className={styles.progressLabel}>Step 2 of 5</p>

        <h1 className={styles.title}>Discover your style DNA</h1>
        <p className={styles.subtitle}>
          {isFinished
            ? 'Your style profile is ready!'
            : `Swipe right if you love it, left to skip (${currentIndex + 1}/${STYLE_LOOKS.length})`}
        </p>

        {!isFinished ? (
          <>
            {/* Card */}
            <div
              className={`${styles.card} ${
                swipeDirection === 'right' ? styles.cardSwipeRight : ''
              } ${swipeDirection === 'left' ? styles.cardSwipeLeft : ''}`}
            >
              {/* Color palette visualization */}
              <div className={styles.cardVisual}>
                <div className={styles.colorGrid}>
                  {currentLook.colors.map((color, i) => (
                    <div
                      key={i}
                      className={styles.colorBlock}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className={styles.cardOverlay}>
                  <span className={styles.cardIcon}>
                    {(() => {
                      const Icon = STYLE_ARCHETYPES[currentLook.archetype as keyof typeof STYLE_ARCHETYPES]?.icon;
                      return Icon ? <Icon size={48} /> : null;
                    })()}
                  </span>
                </div>
              </div>

              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>{currentLook.title}</h2>
                <p className={styles.cardDesc}>{currentLook.description}</p>
              </div>
            </div>

            {/* Swipe buttons */}
            <div className={styles.swipeButtons}>
              <button
                id="style-quiz-skip"
                className={styles.swipeBtn}
                onClick={() => handleSwipe('left')}
                type="button"
              >
                <span className={styles.swipeBtnIcon}><X size={24} /></span>
                <span className={styles.swipeBtnLabel}>Skip</span>
              </button>
              <button
                id="style-quiz-like"
                className={`${styles.swipeBtn} ${styles.swipeBtnLike}`}
                onClick={() => handleSwipe('right')}
                type="button"
              >
                <span className={styles.swipeBtnIcon}><Heart size={24} /></span>
                <span className={styles.swipeBtnLabel}>Love it</span>
              </button>
            </div>

            {/* Card counter dots */}
            <div className={styles.dots}>
              {STYLE_LOOKS.map((_, i) => (
                <div
                  key={i}
                  className={`${styles.dot} ${
                    i === currentIndex ? styles.dotActive : ''
                  } ${i < currentIndex ? styles.dotDone : ''}`}
                />
              ))}
            </div>
          </>
        ) : (
          /* Results */
          <div className={styles.results}>
            <div className={styles.resultCard}>
              <div className={styles.resultIcon}><Sparkles size={48} /></div>
              <h2 className={styles.resultTitle}>
                {dominantStyle?.label || 'Eclectic'}
              </h2>
              <p className={styles.resultDesc}>
                {dominantStyle?.description || 'You have a unique, diverse taste. Your AI will adapt to your multifaceted style.'}
              </p>
              <div className={styles.resultStats}>
                <div className={styles.resultStat}>
                  <span className={styles.resultStatValue}>{liked.length}</span>
                  <span className={styles.resultStatLabel}>Loved</span>
                </div>
                <div className={styles.resultStat}>
                  <span className={styles.resultStatValue}>{disliked.length}</span>
                  <span className={styles.resultStatLabel}>Skipped</span>
                </div>
              </div>
            </div>

            <button
              id="style-quiz-continue"
              className={styles.ctaButton}
              onClick={handleContinue}
            >
              Continue to Body Scan
              <span className={styles.ctaArrow}>→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
