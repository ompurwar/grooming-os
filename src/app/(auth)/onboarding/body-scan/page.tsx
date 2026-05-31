'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

type ScanState = 'instructions' | 'front' | 'side' | 'analyzing' | 'results'

const MOCK_RESULTS = {
  bodyType: 'Mesomorph',
  build: 'Athletic',
  shoulders: 'Broad',
  torsoRatio: 'Proportional',
  fitRecs: {
    tops: 'Fitted or regular fit to showcase physique',
    bottoms: 'Straight or regular fit with clean taper',
    outerwear: 'Leather jackets and blazers look great',
  },
  tips: [
    'Your body type is the most versatile — most fits work',
    'V-necks accentuate your broad shoulders',
    'Well-fitted clothes showcase your natural physique',
  ],
}

export default function BodyScanPage() {
  const router = useRouter()
  const [state, setState] = useState<ScanState>('instructions')
  const [frontDone, setFrontDone] = useState(false)

  const handleStartScan = () => {
    setState('front')
  }

  const handleCapture = () => {
    if (state === 'front') {
      setFrontDone(true)
      setState('side')
    } else if (state === 'side') {
      setState('analyzing')
      // Simulate AI analysis
      setTimeout(() => {
        setState('results')
      }, 3000)
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
              We&apos;ll analyze your physique from just 2 photos to recommend the perfect fits.
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

            {/* Camera placeholder */}
            <div className={styles.cameraFrame}>
              <div className={styles.cameraPlaceholder}>
                <div className={styles.silhouette}>
                  <div className={styles.silhouetteHead} />
                  <div className={styles.silhouetteBody} />
                  <div className={styles.silhouetteLegs} />
                </div>
                <p className={styles.cameraGuide}>
                  Align your body within the frame
                </p>
              </div>

              {/* Corner guides */}
              <div className={`${styles.cornerGuide} ${styles.cornerTL}`} />
              <div className={`${styles.cornerGuide} ${styles.cornerTR}`} />
              <div className={`${styles.cornerGuide} ${styles.cornerBL}`} />
              <div className={`${styles.cornerGuide} ${styles.cornerBR}`} />
            </div>

            {/* Photo indicators */}
            <div className={styles.photoIndicators}>
              <div className={`${styles.photoIndicator} ${frontDone ? styles.photoIndicatorDone : state === 'front' ? styles.photoIndicatorActive : ''}`}>
                {frontDone ? '✓' : '1'}
              </div>
              <div className={styles.photoIndicatorLine} />
              <div className={`${styles.photoIndicator} ${state === 'side' ? styles.photoIndicatorActive : ''}`}>
                2
              </div>
            </div>

            <button
              id="body-scan-capture"
              className={styles.captureButton}
              onClick={handleCapture}
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
                <span className={styles.checkmark}>✓</span> Detecting body outline
              </div>
              <div className={styles.analyzingStep}>
                <span className={styles.checkmark}>✓</span> Measuring proportions
              </div>
              <div className={`${styles.analyzingStep} ${styles.analyzingStepActive}`}>
                <span className={styles.spinner}>◌</span> Classifying body type
              </div>
              <div className={styles.analyzingStepPending}>
                <span className={styles.pending}>○</span> Generating fit recommendations
              </div>
            </div>
          </div>
        )}

        {/* Results state */}
        {state === 'results' && (
          <div className={styles.resultsView}>
            <h1 className={styles.title}>Body Analysis Complete</h1>

            <div className={styles.resultCardMain}>
              <div className={styles.resultBadge}>
                <span className={styles.resultBadgeIcon}>🏋️</span>
                <span className={styles.resultBadgeText}>{MOCK_RESULTS.bodyType}</span>
              </div>
              <p className={styles.resultBadgeDesc}>
                Athletic and muscular build with broad shoulders and a medium frame.
              </p>
            </div>

            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Build</span>
                <span className={styles.metricValue}>{MOCK_RESULTS.build}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Shoulders</span>
                <span className={styles.metricValue}>{MOCK_RESULTS.shoulders}</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Torso Ratio</span>
                <span className={styles.metricValue}>{MOCK_RESULTS.torsoRatio}</span>
              </div>
            </div>

            <div className={styles.fitRecsCard}>
              <h3 className={styles.fitRecsTitle}>👔 Your Fit Recommendations</h3>
              <div className={styles.fitRecItem}>
                <span className={styles.fitRecLabel}>Tops</span>
                <span className={styles.fitRecValue}>{MOCK_RESULTS.fitRecs.tops}</span>
              </div>
              <div className={styles.fitRecItem}>
                <span className={styles.fitRecLabel}>Bottoms</span>
                <span className={styles.fitRecValue}>{MOCK_RESULTS.fitRecs.bottoms}</span>
              </div>
              <div className={styles.fitRecItem}>
                <span className={styles.fitRecLabel}>Outerwear</span>
                <span className={styles.fitRecValue}>{MOCK_RESULTS.fitRecs.outerwear}</span>
              </div>
            </div>

            <div className={styles.tipsSection}>
              <h3 className={styles.tipsTitle}>💡 Style Tips for Your Body</h3>
              {MOCK_RESULTS.tips.map((tip, i) => (
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
