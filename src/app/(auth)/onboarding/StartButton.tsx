'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'

export default function StartButton() {
  const router = useRouter()
  const [resumePath, setResumePath] = useState<string>('/onboarding/basic-info')
  const [buttonText, setButtonText] = useState("Let's Begin")

  useEffect(() => {
    async function determineResumeStep() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      
      const userId = session.user.id
      
      const { data: profile } = await supabase.from('users').select('onboarding_completed, age_range').eq('id', userId).maybeSingle()

      if (profile && profile.onboarding_completed === false) {
        if (!profile.age_range) {
          setResumePath('/onboarding/basic-info')
          return
        }
        
        const { data: stylePrefs } = await supabase.from('style_preferences').select('id').eq('user_id', userId).maybeSingle()
        if (!stylePrefs) {
          setResumePath('/onboarding/style-quiz')
          setButtonText('Resume Onboarding')
          return
        }
        
        const { data: bodyProfile } = await supabase.from('body_profiles').select('id').eq('user_id', userId).maybeSingle()
        if (!bodyProfile) {
          setResumePath('/onboarding/body-scan')
          setButtonText('Resume Onboarding')
          return
        }
        
        const { data: faceProfile } = await supabase.from('face_profiles').select('id').eq('user_id', userId).maybeSingle()
        if (!faceProfile) {
          setResumePath('/onboarding/face-scan')
          setButtonText('Resume Onboarding')
          return
        }
        
        setResumePath('/onboarding/wardrobe-seed')
        setButtonText('Resume Onboarding')
      }
    }
    
    determineResumeStep()
  }, [])

  return (
    <button 
      onClick={() => router.push(resumePath)} 
      className={styles.ctaButton} 
      id="onboarding-start-btn"
    >
      {buttonText}
      <span className={styles.ctaArrow}>→</span>
    </button>
  )
}
