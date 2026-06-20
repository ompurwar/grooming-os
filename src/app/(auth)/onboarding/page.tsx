import type { Metadata } from 'next'
import styles from './page.module.css'
import Link from 'next/link'
import { Timer } from 'lucide-react'
import StartButton from './StartButton'

export const metadata: Metadata = {
  title: 'Welcome — Begin Your Style Journey',
  description: 'Set up your Grooming OS profile in under 8 minutes. Body scan, face analysis, and wardrobe digitization.',
}

export default function OnboardingPage() {
  return (
    <div className={styles.container}>
      {/* Background orbs */}
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />

      <div className={styles.content}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <h1 className={styles.logo}>
            <span className="gradient-text">GROOMING</span> OS
          </h1>
          <p className={styles.tagline}>Your AI Stylist Awaits</p>
        </div>

        {/* Steps overview */}
        <div className={styles.stepsOverview}>
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepInfo}>
              <h3 className={styles.stepTitle}>About You</h3>
              <p className={styles.stepDesc}>Basic info & style preferences</p>
            </div>
          </div>

          <div className={styles.stepConnector} />

          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepInfo}>
              <h3 className={styles.stepTitle}>Style DNA</h3>
              <p className={styles.stepDesc}>Discover your style archetype</p>
            </div>
          </div>

          <div className={styles.stepConnector} />

          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepInfo}>
              <h3 className={styles.stepTitle}>Body Scan</h3>
              <p className={styles.stepDesc}>AI maps your physique</p>
            </div>
          </div>

          <div className={styles.stepConnector} />

          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>4</div>
            <div className={styles.stepInfo}>
              <h3 className={styles.stepTitle}>Face Scan</h3>
              <p className={styles.stepDesc}>Face shape & skin tone analysis</p>
            </div>
          </div>

          <div className={styles.stepConnector} />

          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>5</div>
            <div className={styles.stepInfo}>
              <h3 className={styles.stepTitle}>Wardrobe Seed</h3>
              <p className={styles.stepDesc}>Add your first few items</p>
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className={styles.infoCard}>
          <div className={styles.infoIcon}><Timer size={24} /></div>
          <div>
            <p className={styles.infoTitle}>Takes under 8 minutes</p>
            <p className={styles.infoDesc}>
              The more you share, the smarter your AI stylist becomes.
            </p>
          </div>
        </div>

        {/* CTA */}
        <StartButton />

        <Link href="/home" className={styles.skipLink} id="onboarding-skip-btn">
          Skip for now
        </Link>
      </div>
    </div>
  )
}
