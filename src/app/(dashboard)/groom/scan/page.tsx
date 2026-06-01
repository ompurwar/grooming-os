'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import CameraCapture from '@/components/grooming/CameraCapture'
import styles from './page.module.css'

type ScanState = 'instructions' | 'camera' | 'uploading' | 'analyzing' | 'results'

const ANALYSIS_STEPS = [
  'Detecting facial landmarks',
  'Mapping face shape & jawline',
  'Sampling skin tone & undertone',
  'Calculating color harmonies',
  'Generating grooming recommendations',
]

export default function GroomScanPage() {
  const router = useRouter()
  const [state, setState] = useState<ScanState>('instructions')
  const [currentStep, setCurrentStep] = useState(0)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleStartScan = () => {
    setState('camera')
  }

  const handleCapture = async (blob: Blob) => {
    setState('uploading')
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      // 1. Upload to Supabase Storage
      const fileName = `face-scans/${session.user.id}/${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('wardrobe-images')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true })

      if (uploadError) throw new Error('Failed to upload photo')

      const { data: urlData } = supabase.storage
        .from('wardrobe-images')
        .getPublicUrl(fileName)

      const imageUrl = urlData.publicUrl

      // 2. Call the face analysis API
      setState('analyzing')

      // Animate through steps
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= ANALYSIS_STEPS.length - 1) {
            clearInterval(stepInterval)
            return prev
          }
          return prev + 1
        })
      }, 1800)

      const res = await fetch('/api/analyze/face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })

      clearInterval(stepInterval)
      setCurrentStep(ANALYSIS_STEPS.length - 1)

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')

      setAnalysisResult(data.data)

      // 3. Also generate grooming recommendations based on the new profile
      await fetch('/api/groom/recommendations')

      setState('results')
    } catch (err: any) {
      console.error('Scan error:', err)
      setError(err.message || 'Something went wrong')
      setState('instructions')
    }
  }

  const handleDone = () => {
    router.push('/groom')
  }

  return (
    <div className={styles.container}>
      <div className={styles.bgOrb} />

      {/* Instructions */}
      {state === 'instructions' && (
        <div className={styles.section}>
          <h1 className={styles.title}>Face Scan</h1>
          <p className={styles.subtitle}>
            AI will analyze your face shape, features, and skin tone for personalized grooming recommendations.
          </p>

          {error && (
            <div className={styles.errorBanner}>
              <span>⚠️</span> {error}
            </div>
          )}

          <div className={styles.tipsCard}>
            <h3 className={styles.tipsTitle}>📸 For best results:</h3>
            <ul className={styles.tipsList}>
              <li>Look directly at the camera</li>
              <li>Ensure good, even lighting</li>
              <li>Keep a neutral expression</li>
              <li>Remove glasses or hats if possible</li>
            </ul>
          </div>

          <button className={styles.ctaButton} onClick={handleStartScan}>
            Open Camera
            <span className={styles.ctaArrow}>→</span>
          </button>

          <button className={styles.skipBtn} onClick={() => router.back()}>
            ← Go back
          </button>
        </div>
      )}

      {/* Camera */}
      {state === 'camera' && (
        <div className={styles.section}>
          <h2 className={styles.cameraTitle}>Face View</h2>
          <CameraCapture
            mode="face"
            onCapture={handleCapture}
            onCancel={() => setState('instructions')}
          />
        </div>
      )}

      {/* Uploading */}
      {state === 'uploading' && (
        <div className={styles.analyzingSection}>
          <div className={styles.spinnerLarge} />
          <h2 className={styles.analyzingTitle}>Uploading photo...</h2>
        </div>
      )}

      {/* Analyzing */}
      {state === 'analyzing' && (
        <div className={styles.analyzingSection}>
          <div className={styles.spinnerLarge} />
          <h2 className={styles.analyzingTitle}>Analyzing your features</h2>
          <p className={styles.analyzingSubtitle}>
            AI is mapping your face shape, jawline, and color palette...
          </p>
          <div className={styles.stepsList}>
            {ANALYSIS_STEPS.map((step, i) => (
              <div
                key={i}
                className={`${styles.stepItem} ${i < currentStep ? styles.stepDone : ''} ${i === currentStep ? styles.stepActive : ''}`}
              >
                <span className={styles.stepIcon}>
                  {i < currentStep ? '✓' : i === currentStep ? '◌' : '○'}
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {state === 'results' && analysisResult && (
        <div className={styles.section}>
          <h1 className={styles.title}>Analysis Complete ✨</h1>

          {/* Feature grid */}
          <div className={styles.featuresGrid}>
            <FeatureCard icon="👱" label="Face Shape" value={analysisResult.face_shape} />
            <FeatureCard icon="🎨" label="Skin Tone" value={analysisResult.skin_tone} />
            <FeatureCard icon="🌡️" label="Undertone" value={analysisResult.undertone} />
            <FeatureCard icon="💪" label="Jawline" value={analysisResult.jawline} />
            <FeatureCard icon="👁️" label="Eye Shape" value={analysisResult.eye_shape} />
            <FeatureCard icon="💇" label="Hair Type" value={analysisResult.hair_type} />
            <FeatureCard icon="🧔" label="Facial Hair" value={analysisResult.facial_hair_status} />
            <FeatureCard icon="🌺" label="Color Season" value={analysisResult.color_season} />
          </div>

          {/* Color Palette */}
          <div className={styles.paletteCard}>
            <h3 className={styles.paletteTitle}>Your Best Colors</h3>
            <div className={styles.colorList}>
              {analysisResult.best_colors?.map((color: string, i: number) => (
                <span key={i} className={styles.colorChip}>{color}</span>
              ))}
            </div>
            {analysisResult.avoid_colors?.length > 0 && (
              <>
                <h4 className={styles.avoidTitle}>Avoid</h4>
                <div className={styles.colorList}>
                  {analysisResult.avoid_colors.map((color: string, i: number) => (
                    <span key={i} className={styles.colorChipAvoid}>{color}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Grooming Tips */}
          {analysisResult.grooming_tips?.length > 0 && (
            <div className={styles.tipsCard}>
              <h3 className={styles.tipsTitle}>💡 Grooming Insights</h3>
              <ul className={styles.tipsList}>
                {analysisResult.grooming_tips.map((tip: string, i: number) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <button className={styles.ctaButton} onClick={handleDone}>
            View Full Recommendations
            <span className={styles.ctaArrow}>→</span>
          </button>
        </div>
      )}
    </div>
  )
}

function FeatureCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className={styles.featureCard}>
      <span className={styles.featureIcon}>{icon}</span>
      <span className={styles.featureLabel}>{label}</span>
      <span className={styles.featureValue}>{value}</span>
    </div>
  )
}
