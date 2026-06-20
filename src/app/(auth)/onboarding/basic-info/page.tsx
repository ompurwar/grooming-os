'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'

const AGE_RANGES = ['18-22', '23-27', '28-32', '33-37', '38-45', '45+']
const BUDGET_RANGES = [
  { key: 'budget', label: 'Budget-Friendly', desc: 'Under ₹15K/year' },
  { key: 'mid', label: 'Mid-Range', desc: '₹15K–₹50K/year' },
  { key: 'premium', label: 'Premium', desc: '₹50K–₹2L/year' },
  { key: 'luxury', label: 'Luxury', desc: '₹2L+/year' },
]

export default function BasicInfoPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [city, setCity] = useState('')
  const [occupation, setOccupation] = useState('')
  const [budget, setBudget] = useState('')
  const [isFetching, setIsFetching] = useState(true)
  const [isRetake, setIsRetake] = useState(false)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle()
        if (data) {
          if (data.full_name) setFullName(data.full_name)
          if (data.age_range) setAgeRange(data.age_range)
          if (data.city) setCity(data.city)
          if (data.occupation) setOccupation(data.occupation)
          if (data.budget_range) setBudget(data.budget_range)
        }
      }
      setIsFetching(false)
      if (typeof window !== 'undefined' && window.location.search.includes('retake=true')) {
        setIsRetake(true)
      }
    }
    loadData()
  }, [])

  const isValid = fullName.trim() && ageRange && city.trim()

  const handleContinue = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          age_range: ageRange,
          city: city,
          occupation: occupation,
          budget_range: budget
        })
        .eq('id', session.user.id)

      if (error) throw error
      
      const isRetake = typeof window !== 'undefined' && window.location.search.includes('retake=true')
      if (isRetake) {
        router.push('/profile')
      } else {
        router.push('/onboarding/style-quiz')
      }
    } catch (err) {
      console.error('Failed to save basic info:', err)
      // Ideally show a toast error here
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />

      <div className={styles.content}>
        {/* Progress */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: '20%' }} />
        </div>
        <p className={styles.progressLabel}>Step 1 of 5</p>

        <h1 className={styles.title}>Tell us about yourself</h1>
        <p className={styles.subtitle}>
          This helps your AI stylist understand your lifestyle.
        </p>

        {isFetching ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading your profile...</p>
          </div>
        ) : (
          <>
            <div className={styles.form}>
          {/* Name */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="basic-info-name">Full Name</label>
            <input
              id="basic-info-name"
              type="text"
              className={styles.input}
              placeholder="What should we call you?"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          {/* Age Range */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Age Range</label>
            <div className={styles.pillGrid}>
              {AGE_RANGES.map((range) => (
                <button
                  key={range}
                  id={`basic-info-age-${range}`}
                  className={`${styles.pill} ${ageRange === range ? styles.pillActive : ''}`}
                  onClick={() => setAgeRange(range)}
                  type="button"
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* City */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="basic-info-city">City</label>
            <input
              id="basic-info-city"
              type="text"
              className={styles.input}
              placeholder="For weather-aware styling"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          {/* Occupation */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="basic-info-occupation">
              Occupation <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="basic-info-occupation"
              type="text"
              className={styles.input}
              placeholder="e.g., Software Engineer, Founder"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
            />
          </div>

          {/* Budget */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Fashion Budget</label>
            <div className={styles.budgetGrid}>
              {BUDGET_RANGES.map((b) => (
                <button
                  key={b.key}
                  id={`basic-info-budget-${b.key}`}
                  className={`${styles.budgetCard} ${budget === b.key ? styles.budgetCardActive : ''}`}
                  onClick={() => setBudget(b.key)}
                  type="button"
                >
                  <span className={styles.budgetLabel}>{b.label}</span>
                  <span className={styles.budgetDesc}>{b.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          id="basic-info-continue"
          className={`${styles.ctaButton} ${!isValid ? styles.ctaDisabled : ''}`}
          onClick={handleContinue}
          disabled={!isValid}
        >
          {isRetake ? 'Save Details' : 'Continue'}
          {!isRetake && <span className={styles.ctaArrow}>→</span>}
        </button>
        </>
        )}
      </div>
    </div>
  )
}
