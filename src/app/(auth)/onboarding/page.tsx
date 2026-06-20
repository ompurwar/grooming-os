import type { Metadata } from 'next'
import styles from './page.module.css'
import Link from 'next/link'
import { Timer } from 'lucide-react'
import StartButton from './StartButton'

export const metadata: Metadata = {
  title: 'Welcome — Begin Your Style Journey',
  description: 'Set up your Grooming OS profile in under 8 minutes. Body scan, face analysis, and wardrobe digitization.',
}

import { createClient } from '@/utils/supabase/server'
import { CheckCircle2 } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  let stepsCompleted = {
    step1: false,
    step2: false,
    step3: false,
    step4: false,
  }

  if (session?.user) {
    const userId = session.user.id
    const { data: profile } = await supabase.from('users').select('age_range, onboarding_completed').eq('id', userId).maybeSingle()
    
    if (profile?.onboarding_completed) {
      redirect('/home')
    }

    if (profile?.age_range) stepsCompleted.step1 = true
    
    const { data: stylePrefs } = await supabase.from('style_preferences').select('id').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (stylePrefs) stepsCompleted.step2 = true
    
    const { data: bodyProfile } = await supabase.from('body_profiles').select('id').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (bodyProfile) stepsCompleted.step3 = true
    
    const { data: faceProfile } = await supabase.from('face_profiles').select('id').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (faceProfile) stepsCompleted.step4 = true
  }

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
          <div className={`${styles.stepItem} ${stepsCompleted.step1 ? styles.stepItemCompleted : ''}`}>
            <div className={`${styles.stepNumber} ${stepsCompleted.step1 ? styles.stepNumberCompleted : ''}`}>
              {stepsCompleted.step1 ? <CheckCircle2 size={16} /> : '1'}
            </div>
            <div className={styles.stepInfo}>
              <h3 className={styles.stepTitle}>About You</h3>
              <p className={styles.stepDesc}>Basic info & style preferences</p>
            </div>
          </div>

          <div className={styles.stepConnector} />

          <div className={`${styles.stepItem} ${stepsCompleted.step2 ? styles.stepItemCompleted : ''}`}>
            <div className={`${styles.stepNumber} ${stepsCompleted.step2 ? styles.stepNumberCompleted : ''}`}>
              {stepsCompleted.step2 ? <CheckCircle2 size={16} /> : '2'}
            </div>
            <div className={styles.stepInfo}>
              <h3 className={styles.stepTitle}>Style DNA</h3>
              <p className={styles.stepDesc}>Discover your style archetype</p>
            </div>
          </div>

          <div className={styles.stepConnector} />

          <div className={`${styles.stepItem} ${stepsCompleted.step3 ? styles.stepItemCompleted : ''}`}>
            <div className={`${styles.stepNumber} ${stepsCompleted.step3 ? styles.stepNumberCompleted : ''}`}>
              {stepsCompleted.step3 ? <CheckCircle2 size={16} /> : '3'}
            </div>
            <div className={styles.stepInfo}>
              <h3 className={styles.stepTitle}>Body Scan</h3>
              <p className={styles.stepDesc}>AI maps your physique</p>
            </div>
          </div>

          <div className={styles.stepConnector} />

          <div className={`${styles.stepItem} ${stepsCompleted.step4 ? styles.stepItemCompleted : ''}`}>
            <div className={`${styles.stepNumber} ${stepsCompleted.step4 ? styles.stepNumberCompleted : ''}`}>
              {stepsCompleted.step4 ? <CheckCircle2 size={16} /> : '4'}
            </div>
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
