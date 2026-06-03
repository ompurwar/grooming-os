'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import styles from './page.module.css'

type ScanState = 'instructions' | 'front' | 'side' | 'analyzing' | 'results'

export default function BodyScanPage() {
  const router = useRouter()
  const [state, setState] = useState<ScanState>('instructions')
  
  const [frontImageFile, setFrontImageFile] = useState<File | null>(null)
  const [sideImageFile, setSideImageFile] = useState<File | null>(null)
  const [frontImageUrl, setFrontImageUrl] = useState<string | null>(null)
  const [sideImageUrl, setSideImageUrl] = useState<string | null>(null)
  
  const [results, setResults] = useState<any>(null)
  
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleStartScan = () => {
    setState('front')
  }

  const handleCaptureClick = () => {
    cameraInputRef.current?.click()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    e.target.value = '' // reset input
    
    // We create a local preview URL immediately for better UX
    const previewUrl = URL.createObjectURL(file)

    if (state === 'front') {
      setFrontImageFile(file)
      setFrontImageUrl(previewUrl)
      setState('side')
    } else if (state === 'side') {
      setSideImageFile(file)
      setSideImageUrl(previewUrl)
      
      // Both images captured, proceed to analysis
      setState('analyzing')
      await uploadAndAnalyze(frontImageFile!, file)
    }
  }

  const uploadAndAnalyze = async (frontFile: File, sideFile: File) => {
    try {
      const supabase = createClient()
      
      // Upload front image
      const frontName = `front_${Math.random().toString(36).substring(2)}.jpg`
      const { error: frontErr } = await supabase.storage.from('wardrobe-images').upload(`uploads/${frontName}`, frontFile)
      if (frontErr) throw new Error('Failed to upload front image')
      
      const { data: { publicUrl: frontUrl } } = supabase.storage.from('wardrobe-images').getPublicUrl(`uploads/${frontName}`)
      
      // Upload side image
      const sideName = `side_${Math.random().toString(36).substring(2)}.jpg`
      const { error: sideErr } = await supabase.storage.from('wardrobe-images').upload(`uploads/${sideName}`, sideFile)
      if (sideErr) throw new Error('Failed to upload side image')
      
      const { data: { publicUrl: sideUrl } } = supabase.storage.from('wardrobe-images').getPublicUrl(`uploads/${sideName}`)
      
      // Call API
      const res = await fetch('/api/analyze/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frontImageUrl: frontUrl, sideImageUrl: sideUrl })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      
      setResults(data.data)
      setState('results')
      
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Something went wrong during analysis')
      // Reset back to front scan
      setState('front')
      setFrontImageFile(null)
      setSideImageFile(null)
    }
  }

  const handleContinue = () => {
    router.push('/onboarding/face-scan')
  }

  return (
    <div className={styles.container}>
      <div className={styles.bgOrb1} />

      <div className={styles.content}>
        {/* Progress */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: '60%' }} />
        </div>
        <p className={styles.progressLabel}>Step 3 of 5</p>

        {/* Instructions state */}
        {state === 'instructions' && (
          <div className={styles.instructionsView}>
            <h1 className={styles.title}>Body Scan</h1>
            <p className={styles.subtitle}>
              We&apos;ll analyze your physique from a front and side photo to recommend the perfect fits.
            </p>

            <div className={styles.tipsCard}>
              <h3 className={styles.tipsTitle}>📸 For best results:</h3>
              <ul className={styles.tipsList}>
                <li>Stand in a well-lit area</li>
                <li>Wear fitted clothing (not oversized)</li>
                <li>Keep arms slightly away from body</li>
                <li>Full body visible — head to feet</li>
                <li>Have someone take the photo, or use a timer</li>
              </ul>
            </div>

            <div className={styles.scanTypes}>
              <div className={styles.scanTypeCard}>
                <div className={styles.scanTypeIcon}>👤</div>
                <span className={styles.scanTypeLabel}>Front View</span>
              </div>
              <div className={styles.scanConnector}>+</div>
              <div className={styles.scanTypeCard}>
                <div className={styles.scanTypeIcon}>👤</div>
                <span className={styles.scanTypeLabel}>Side View</span>
              </div>
            </div>

            <button
              id="body-scan-start"
              className={styles.ctaButton}
              onClick={handleStartScan}
            >
              Start Body Scan
              <span className={styles.ctaArrow}>→</span>
            </button>

            <button
              className={styles.skipLink}
              onClick={() => router.push('/onboarding/face-scan')}
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Camera states */}
        {(state === 'front' || state === 'side') && (
          <div className={styles.cameraView}>
            <h2 className={styles.cameraTitle}>
              {state === 'front' ? 'Front View' : 'Side View'}
            </h2>
            <p className={styles.cameraSubtitle}>
              {state === 'front'
                ? 'Face the camera directly'
                : 'Turn 90° to your left or right'}
            </p>

            {/* Hidden file input */}
            <input 
              type="file" 
              accept="image/*"
              capture="environment"
              className={styles.hiddenInput}
              style={{ display: 'none' }}
              ref={cameraInputRef}
              onChange={handleImageUpload}
            />

            {/* Camera placeholder / Preview */}
            <div className={styles.cameraFrame} onClick={handleCaptureClick}>
              {state === 'side' && frontImageUrl ? (
                 <div className={styles.cameraPlaceholder} style={{ background: `url(${frontImageUrl}) center/cover`, opacity: 0.3 }}>
                   <p className={styles.cameraGuide} style={{ color: '#fff', textShadow: '0 0 4px #000' }}>
                     Tap to capture side photo
                   </p>
                 </div>
              ) : (
                <div className={styles.cameraPlaceholder}>
                  <div className={styles.silhouette}>
                    <div className={styles.silhouetteHead} />
                    <div className={styles.silhouetteBody} />
                    <div className={styles.silhouetteLegs} />
                  </div>
                  <p className={styles.cameraGuide}>
                    Tap anywhere inside to take photo
                  </p>
                </div>
              )}

              {/* Corner guides */}
              <div className={`${styles.cornerGuide} ${styles.cornerTL}`} />
              <div className={`${styles.cornerGuide} ${styles.cornerTR}`} />
              <div className={`${styles.cornerGuide} ${styles.cornerBL}`} />
              <div className={`${styles.cornerGuide} ${styles.cornerBR}`} />
            </div>

            {/* Photo indicators */}
            <div className={styles.photoIndicators}>
              <div className={`${styles.photoIndicator} ${state === 'side' ? styles.photoIndicatorDone : styles.photoIndicatorActive}`}>
                {state === 'side' ? '✓' : '1'}
              </div>
              <div className={styles.photoIndicatorLine} />
              <div className={`${styles.photoIndicator} ${state === 'side' ? styles.photoIndicatorActive : ''}`}>
                2
              </div>
            </div>

            <button
              id="body-scan-capture"
              className={styles.captureButton}
              onClick={handleCaptureClick}
            >
              <div className={styles.captureRing}>
                <div className={styles.captureCenter} />
              </div>
            </button>

            <p className={styles.captureHint}>
              Tap to capture {state === 'front' ? 'front' : 'side'} photo
            </p>
          </div>
        )}

        {/* Analyzing state */}
        {state === 'analyzing' && (
          <div className={styles.analyzingView}>
            <div className={styles.analyzingSpinner}>
              <div className={styles.spinnerRing} />
            </div>
            <h2 className={styles.analyzingTitle}>Analyzing your physique</h2>
            <p className={styles.analyzingSubtitle}>
              AI is mapping your proportions, body type, and best fits...
            </p>
            <div className={styles.analyzingSteps}>
              <div className={styles.analyzingStep}>
                <span className={styles.checkmark}>✓</span> Extracting silhouette
              </div>
              <div className={styles.analyzingStep}>
                <span className={styles.checkmark}>✓</span> Measuring proportions
              </div>
              <div className={`${styles.analyzingStep} ${styles.analyzingStepActive}`}>
                <span className={styles.spinner}>◌</span> Classifying body type
              </div>
            </div>
          </div>
        )}

        {/* Results state */}
        {state === 'results' && results && (
          <div className={styles.resultsView}>
            <h1 className={styles.title}>Body Analysis Complete</h1>

            <div className={styles.resultCardMain}>
              <div className={styles.resultBadge}>
                <span className={styles.resultBadgeIcon}>🏋️</span>
                <span className={styles.resultBadgeText}>{results.body_type}</span>
              </div>
              <p className={styles.resultBadgeDesc}>
                {results.height_estimate} with {results.shoulder_width?.toLowerCase()} shoulders and a {results.torso_ratio?.toLowerCase()}.
              </p>
            </div>

            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Build</span>
                <span className={styles.metricValue}>{results.build}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Shoulders</span>
                <span className={styles.metricValue}>{results.shoulder_width}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Proportions</span>
                <span className={styles.metricValue}>{results.shoulder_to_hip || results.torso_ratio}</span>
              </div>
            </div>

            <div className={styles.fitRecsCard}>
              <h3 className={styles.fitRecsTitle}>👔 Your Fit Recommendations</h3>
              <div className={styles.fitRecItem}>
                <span className={styles.fitRecLabel}>Tops</span>
                <span className={styles.fitRecValue}>{results.fit_recommendations?.top_fit || 'Regular'}</span>
              </div>
              <div className={styles.fitRecItem}>
                <span className={styles.fitRecLabel}>Bottoms</span>
                <span className={styles.fitRecValue}>{results.fit_recommendations?.bottom_fit || 'Regular'}</span>
              </div>
              <div className={styles.fitRecItem}>
                <span className={styles.fitRecLabel}>Outerwear</span>
                <span className={styles.fitRecValue}>{results.fit_recommendations?.outerwear_fit || 'Regular'}</span>
              </div>
            </div>

            <div className={styles.tipsSection}>
              <h3 className={styles.tipsTitle}>💡 Style Tips for Your Body</h3>
              {(results.style_tips || []).map((tip: string, i: number) => (
                <div key={i} className={styles.tipItem}>
                  <span className={styles.tipBullet}>•</span>
                  {tip}
                </div>
              ))}
            </div>

            <button
              id="body-scan-continue"
              className={styles.ctaButton}
              onClick={handleContinue}
            >
              Continue to Face Scan
              <span className={styles.ctaArrow}>→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
