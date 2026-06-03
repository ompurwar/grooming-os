'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { fetchWeatherContext, WeatherContext } from '@/utils/weather'
import { toast } from 'sonner'
import { triggerHaptic, hapticPatterns } from '@/utils/haptics'
import styles from './page.module.css'

const OCCASION_CHIPS = [
  'Office', 'Dinner Date', 'Casual Friday', 'Wedding',
  'Coffee', 'Gym', 'Interview', 'Club Night'
]

function getTimeAgo(dateStr: string): string {
  const now = Date.now()
  const created = new Date(dateStr).getTime()
  const diffMs = now - created
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function StyleContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [prompt, setPrompt] = useState('')
  
  // Context states
  const [isDetectingContext, setIsDetectingContext] = useState(false)
  const [contextData, setContextData] = useState<WeatherContext | null>(null)
  const [showContextModal, setShowContextModal] = useState(false)
  
  // Manual override states
  const [manualCity, setManualCity] = useState('')
  const [manualTemp, setManualTemp] = useState('')
  const [manualCond, setManualCond] = useState('')

  const [isGenerating, setIsGenerating] = useState(false)
  const hasAutoRun = useRef(false)

  // Saved looks for the preview section
  const [savedLooks, setSavedLooks] = useState<any[]>([])

  useEffect(() => {
    async function initStyle() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return
      }

      const { data } = await supabase
        .from('outfits')
        .select('id, occasion, created_at')
        .eq('user_id', session.user.id)
        .eq('is_saved', true)
        .order('created_at', { ascending: false })
        .limit(4)
      setSavedLooks(data ?? [])
    }
    initStyle()
  }, [])

  const executeGeneration = async (textToSubmit: string, finalContext: any) => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/style/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSubmit, weatherContext: finalContext })
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Failed to generate style')
      
      router.push(`/style/get-ready?id=${data.outfitId}`)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message)
      triggerHaptic(hapticPatterns.error)
      setIsGenerating(false)
    }
  }

  const [existingMatch, setExistingMatch] = useState<{ id: string, occasion: string } | null>(null)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [pendingPrompt, setPendingPrompt] = useState('')

  const handleInitialStyleClick = async (e?: React.FormEvent, directPrompt?: string) => {
    if (e) e.preventDefault()
    
    const textToSubmit = directPrompt || prompt
    if (!textToSubmit.trim()) return

    triggerHaptic(hapticPatterns.light)

    // Check for existing similar outfits first
    try {
      const checkRes = await fetch('/api/style/check-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSubmit })
      })
      const checkData = await checkRes.json()
      if (checkData.match) {
        setExistingMatch(checkData.match)
        setPendingPrompt(textToSubmit)
        setShowDuplicateModal(true)
        return
      }
    } catch (err) {
      console.warn('Failed to check existing outfits', err)
    }

    proceedWithStyle(textToSubmit)
  }

  const proceedWithStyle = (textToSubmit: string) => {
    // Check cache
    try {
      const cached = localStorage.getItem('weatherContextCache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Date.now() - parsed.timestamp < 2 * 60 * 60 * 1000) {
          executeGeneration(textToSubmit, parsed.context)
          return
        }
      }
    } catch (e) {}

    setIsDetectingContext(true)
    setShowContextModal(true)

    const timeout = setTimeout(() => {
      setIsDetectingContext(false)
    }, 8000)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(timeout)
          const context = await fetchWeatherContext(position.coords.latitude, position.coords.longitude)
          setContextData(context)
          setManualCity(context.city)
          setManualTemp(context.temperature.toString())
          setManualCond(context.condition)
          setIsDetectingContext(false)
          
          // Auto-confirm after successful fetch to save a click
          localStorage.setItem('weatherContextCache', JSON.stringify({ timestamp: Date.now(), context }))
          setShowContextModal(false)
          executeGeneration(textToSubmit, context)
        },
        (error) => {
          console.warn('Geolocation denied or failed', error)
          clearTimeout(timeout)
          const fallback = { city: 'New York', temperature: 22, condition: 'Clear' }
          setContextData(fallback)
          setManualCity(fallback.city)
          setManualTemp(fallback.temperature.toString())
          setManualCond(fallback.condition)
          setIsDetectingContext(false)
        },
        { timeout: 5000 }
      )
    } else {
      clearTimeout(timeout)
      const fallback = { city: 'New York', temperature: 22, condition: 'Clear' }
      setContextData(fallback)
      setManualCity(fallback.city)
      setManualTemp(fallback.temperature.toString())
      setManualCond(fallback.condition)
      setIsDetectingContext(false)
    }
  }

  const handleConfirmStyle = () => {
    if (!prompt.trim()) return
    triggerHaptic(hapticPatterns.medium)
    setShowContextModal(false)
    
    const finalContext = {
      city: manualCity,
      temperature: parseFloat(manualTemp) || 20,
      condition: manualCond
    }
    
    localStorage.setItem('weatherContextCache', JSON.stringify({ timestamp: Date.now(), context: finalContext }))
    executeGeneration(prompt, finalContext)
  }

  const handleDuplicateAction = (action: 'view' | 'new') => {
    setShowDuplicateModal(false)
    if (action === 'view' && existingMatch) {
      router.push(`/style/get-ready?id=${existingMatch.id}`)
    } else {
      proceedWithStyle(pendingPrompt)
    }
  }

  useEffect(() => {
    const queryPrompt = searchParams.get('prompt')
    if (queryPrompt && !hasAutoRun.current) {
      hasAutoRun.current = true
      setPrompt(queryPrompt)
      handleInitialStyleClick(undefined, queryPrompt)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleChipClick = (chip: string) => {
    triggerHaptic(hapticPatterns.light)
    const text = `Get me ready for a ${chip.toLowerCase()}`
    setPrompt(text)
    handleInitialStyleClick(undefined, text)
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Styling Hub</h1>
      </header>

      {/* Hero Action */}
      <section className={styles.heroCard}>
        <div className={styles.glow} />
        <h2>What's the occasion?</h2>
        <p>Describe your event or mood, and AI will craft the perfect look.</p>
        
        <form onSubmit={handleInitialStyleClick} className={styles.form}>
          <textarea 
            className={styles.promptInput}
            placeholder="E.g., I'm going to a rooftop dinner in a slightly chilly city..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
          <button 
            type="submit"
            className={`${styles.styleBtn} ${!prompt.trim() || isGenerating ? styles.styleBtnDisabled : ''}`}
            disabled={!prompt.trim() || isGenerating}
          >
            {isGenerating ? 'Curating Look...' : 'Style Me ✨'}
          </button>
        </form>

        <div className={styles.chipsLabel}>Popular Occasions</div>
        <div className={styles.chipsGrid}>
          {OCCASION_CHIPS.map(chip => (
            <button
              key={chip}
              type="button"
              className={styles.chip}
              onClick={() => handleChipClick(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      </section>

      {/* OOTD */}
      <section className={styles.ootdSection}>
        <h3 className={styles.sectionTitle}>Look of the Day</h3>
        <div className={styles.ootdCard}>
          <div className={styles.ootdBadge}>Daily AI Curated</div>
          <div className={styles.ootdContent}>
            <div className={styles.ootdIcon}>👔</div>
            <div className={styles.ootdText}>
              <h4>Smart Casual Friday</h4>
              <p>Based on your schedule and today's weather in your city.</p>
            </div>
            <Link href="/style/get-ready" className={styles.ootdBtn}>View Look</Link>
          </div>
        </div>
      </section>

      {/* Saved Looks */}
      <section className={styles.savedSection}>
        <div className={styles.savedHeader}>
          <h3 className={styles.sectionTitle}>Saved Looks</h3>
          <Link href="/style/saved" className={styles.seeAll}>See All →</Link>
        </div>
        
        {savedLooks.length === 0 ? (
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
            No saved looks yet. Style yourself and save your favourites!
          </p>
        ) : (
          <div className={styles.savedScroll}>
            {savedLooks.map((look: any) => {
              const ago = getTimeAgo(look.created_at)
              return (
                <Link key={look.id} href={`/style/get-ready?id=${look.id}`} className={styles.savedCard} style={{ textDecoration: 'none' }}>
                  <div className={styles.savedVisual}>
                    <div className={styles.miniItem}>✨</div>
                  </div>
                  <div className={styles.savedInfo}>
                    <h4>{look.occasion || 'Untitled'}</h4>
                    <span>{ago}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Context Modal */}
      {showContextModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Confirm Context</h3>
            
            {isDetectingContext ? (
              <div className={styles.loadingContext}>
                <div className={styles.spinner} />
                <p>Detecting your location and weather...</p>
                <p className={styles.subtext}>Please allow location access if prompted.</p>
              </div>
            ) : (
              <div className={styles.contextForm}>
                <p className={styles.contextIntro}>We detected your local weather to style you better. Is this correct?</p>
                
                <div className={styles.contextGrid}>
                  <div className={styles.field}>
                    <label>City</label>
                    <input 
                      type="text" 
                      value={manualCity} 
                      onChange={(e) => setManualCity(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Temp (°C)</label>
                    <input 
                      type="number" 
                      value={manualTemp} 
                      onChange={(e) => setManualTemp(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Condition</label>
                    <input 
                      type="text" 
                      value={manualCond} 
                      onChange={(e) => setManualCond(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button className={styles.cancelBtn} onClick={() => setShowContextModal(false)}>Cancel</button>
                  <button className={styles.confirmBtn} onClick={handleConfirmStyle}>Confirm & Style Me ✨</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Duplicate Check Modal */}
      {showDuplicateModal && existingMatch && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Similar Look Found</h3>
            <div className={styles.contextForm}>
              <p className={styles.contextIntro} style={{ marginBottom: '24px' }}>
                You already have a saved look for <strong>"{existingMatch.occasion}"</strong>. Would you like to view this look or generate a brand new one?
              </p>
              
              <div className={styles.modalActions} style={{ flexDirection: 'column', gap: '12px' }}>
                <button 
                  className={styles.confirmBtn} 
                  style={{ width: '100%', padding: '14px' }}
                  onClick={() => handleDuplicateAction('view')}
                >
                  View Existing Look
                </button>
                <button 
                  className={styles.cancelBtn} 
                  style={{ width: '100%', padding: '14px', background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}
                  onClick={() => handleDuplicateAction('new')}
                >
                  Generate Something Else
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StylePage() {
  return (
    <Suspense fallback={<div className={styles.container}><div className={styles.loadingContext}><div className={styles.spinner} /></div></div>}>
      <StyleContent />
    </Suspense>
  )
}
