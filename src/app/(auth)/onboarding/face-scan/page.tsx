'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import CameraCapture from '@/components/grooming/CameraCapture'
import styles from './page.module.css'

type ScanState = 'instructions' | 'scanning' | 'analyzing' | 'results'

const ANALYSIS_STEPS = [
  'Detecting facial landmarks',
  'Mapping face shape & jawline',
  'Sampling skin tone & undertone',
  'Calculating color harmonies',
  'Preparing grooming tips',
]

export default function FaceScanPage() {
  const router = useRouter()
  const [state, setState] = useState<ScanState>('instructions')
  const [currentStep, setCurrentStep] = useState(0)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleStartScan = () => {
    setState('scanning')
  }

  const handleCapture = async (blob: Blob) => {
    setState('analyzing')
    setError(null)

    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) throw new Error('Not authenticated')

      // Upload to Supabase Storage
      const fileName = `face-scans/${userData.user.id}/${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('wardrobe-images')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true })

      if (uploadError) throw new Error('Failed to upload photo')

      const { data: urlData } = supabase.storage
        .from('wardrobe-images')
        .getPublicUrl(fileName)

      // Animate steps
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= ANALYSIS_STEPS.length - 1) {
            clearInterval(stepInterval)
            return prev
          }
          return prev + 1
        })
      }, 1500)

      // Call face analysis API
      const res = await fetch('/api/analyze/face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: urlData.publicUrl }),
      })

      clearInterval(stepInterval)
      setCurrentStep(ANALYSIS_STEPS.length - 1)

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')

      setResults(data.data)

      // Also trigger recommendations generation
      await fetch('/api/groom/recommendations')

      setState('results')
    } catch (err: any) {
      console.error('Face scan error:', err)
      setError(err.message)
      setState('instructions')
    }
  }

  const handleContinue = () => {
    router.push('/onboarding/wardrobe-seed')
  }

  return (
    <div className={styles.container}>
      <div className={styles.bgOrb1} />

      <div className={styles.content}>
        {/* Progress */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: '80%' }} />
        </div>
        <p className={styles.progressLabel}>Step 4 of 5</p>

        {/* Instructions state */}
        {state === 'instructions' && (
          <div className={styles.instructionsView}>
            <h1 className={styles.title}>Face Analysis</h1>
            <p className={styles.subtitle}>
              Let&apos;s map your face shape, features, and skin tone for personalized grooming and color palettes.
            </p>

            {error && (
              <div style={{ color: '#ef4444', fontSize: '14px', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '12px' }}>
                ⚠️ {error}
              </div>
            )}

            <div className={styles.tipsCard}>
              <h3 className={styles.tipsTitle}>📸 For best results:</h3>
              <ul className={styles.tipsList}>
                <li>Look directly at the camera</li>
                <li>Ensure good, even lighting (no harsh shadows)</li>
                <li>Keep a neutral expression</li>
                <li>Remove glasses or hats if possible</li>
              </ul>
            </div>

            <button
              id="face-scan-start"
              className={styles.ctaButton}
              onClick={handleStartScan}
            >
              Start Face Scan
              <span className={styles.ctaArrow}>→</span>
            </button>

            <button
              className={styles.skipLink}
              onClick={() => router.push('/onboarding/wardrobe-seed')}
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Camera state — real camera */}
        {state === 'scanning' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <h2 className={styles.cameraTitle}>Face View</h2>
            <CameraCapture
              mode="face"
              onCapture={handleCapture}
              onCancel={() => setState('instructions')}
            />
          </div>
        )}

        {/* Analyzing state */}
        {state === 'analyzing' && (
          <div className={styles.analyzingView}>
            <div className={styles.analyzingSpinner}>
              <div className={styles.spinnerRing} />
            </div>
            <h2 className={styles.analyzingTitle}>Analyzing your features</h2>
            <p className={styles.analyzingSubtitle}>
              AI is mapping your face shape, jawline, and extracting your color palette...
            </p>
            <div className={styles.analyzingSteps}>
              {ANALYSIS_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={`${styles.analyzingStep} ${
                    i < currentStep ? '' : i === currentStep ? styles.analyzingStepActive : styles.analyzingStepPending
                  }`}
                >
                  <span className={i < currentStep ? styles.checkmark : i === currentStep ? styles.spinner : styles.pending}>
                    {i < currentStep ? '✓' : i === currentStep ? '◌' : '○'}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results state */}
        {state === 'results' && results && (
          <div className={styles.resultsView}>
            <h1 className={styles.title}>Face Analysis Complete</h1>

            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricIcon}>👱</span>
                <span className={styles.metricLabel}>Face Shape</span>
                <span className={styles.metricValue}>{results.face_shape}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricIcon}>🎨</span>
                <span className={styles.metricLabel}>Skin Tone</span>
                <span className={styles.metricValue}>{results.skin_tone}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricIcon}>🌡️</span>
                <span className={styles.metricLabel}>Undertone</span>
                <span className={styles.metricValue}>{results.undertone}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricIcon}>💇</span>
                <span className={styles.metricLabel}>Hair Type</span>
                <span className={styles.metricValue}>{results.hair_type}</span>
              </div>
            </div>

            {results.best_colors?.length > 0 && (
              <div className={styles.paletteCard}>
                <h3 className={styles.paletteTitle}>Your Best Colors</h3>
                <div className={styles.colorSwatches}>
                  {results.best_colors.map((color: string, i: number) => (
                    <span key={i} style={{
                      padding: '4px 12px',
                      background: 'rgba(74,158,255,0.1)',
                      border: '1px solid rgba(74,158,255,0.2)',
                      borderRadius: '100px',
                      fontSize: '12px',
                      color: 'var(--color-accent-light)'
                    }}>{color}</span>
                  ))}
                </div>
                {results.avoid_colors?.length > 0 && (
                  <p className={styles.paletteDesc}>
                    Avoid: {results.avoid_colors.join(', ')}
                  </p>
                )}
              </div>
            )}

            {results.grooming_tips?.length > 0 && (
              <div className={styles.tipsSection}>
                <h3 className={styles.tipsTitle}>💡 Grooming Insights</h3>
                {results.grooming_tips.map((tip: string, i: number) => (
                  <div key={i} className={styles.tipItem}>
                    <span className={styles.tipBullet}>•</span>
                    {tip}
                  </div>
                ))}
              </div>
            )}

            <button
              id="face-scan-continue"
              className={styles.ctaButton}
              onClick={handleContinue}
            >
              Continue to Wardrobe
              <span className={styles.ctaArrow}>→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
