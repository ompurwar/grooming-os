'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { fetchWeatherContext, WeatherContext } from '@/utils/weather'
import { toast } from 'sonner'
import { triggerHaptic, hapticPatterns } from '@/utils/haptics'
import { Sparkles, Briefcase, Globe, Shirt } from 'lucide-react'
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

  // Capsule Form States
  const [mode, setMode] = useState<'daily' | 'capsule'>('daily')
  const [destinations, setDestinations] = useState('')
  const [days, setDays] = useState('')
  const [bagSize, setBagSize] = useState('40')

  const [isGenerating, setIsGenerating] = useState(false)
  const hasAutoRun = useRef(false)

  // Saved looks and capsules for the preview section
  const [savedLooks, setSavedLooks] = useState<any[]>([])
  const [savedCapsules, setSavedCapsules] = useState<any[]>([])
  const [selectedCapsuleId, setSelectedCapsuleId] = useState<string>('')
  const [wardrobeCount, setWardrobeCount] = useState<number | null>(null)
  const [baseItems, setBaseItems] = useState<any[]>([])

  const handleCapsuleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!destinations.trim() || !days) return
    setIsGenerating(true)
    try {
      const res = await fetch('/api/style/capsule/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinations, days, bagSize })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate capsule')
      
      router.push(`/style/capsule/${data.capsuleId}`)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message)
      triggerHaptic(hapticPatterns.error)
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    async function initStyle() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return
      }

      const [looksRes, capsulesResponse, wardrobeCountRes] = await Promise.all([
        supabase
          .from('outfits')
          .select('id, occasion, created_at')
          .eq('user_id', session.user.id)
          .eq('is_saved', true)
          .order('created_at', { ascending: false })
          .limit(4),
        fetch('/api/style/capsules').then(res => res.json()),
        supabase.from('wardrobe_items').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id)
      ])

      setSavedLooks(looksRes.data ?? [])
      setSavedCapsules(capsulesResponse.capsules ?? [])
      setWardrobeCount(wardrobeCountRes.count ?? 0)
    }
    initStyle()
  }, [])

  const executeGeneration = async (textToSubmit: string, finalContext: any, capsuleId?: string) => {
    setIsGenerating(true)
    triggerHaptic(hapticPatterns.medium)

    try {
      const res = await fetch('/api/style/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: textToSubmit, 
          weatherContext: finalContext,
          capsuleId: capsuleId || undefined,
          requiredItemIds: baseItems.length > 0 ? baseItems.map(i => i.id) : undefined
        })
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
  const [duplicateOutfitId, setDuplicateOutfitId] = useState<string | null>(null)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [pendingPrompt, setPendingPrompt] = useState('')

  const handleInitialStyleClick = async (e?: React.FormEvent, directPrompt?: string, capsuleId?: string) => {
    if (e) e.preventDefault()
    
    let textToSubmit = directPrompt || prompt
    if (!textToSubmit.trim() && baseItems.length === 0) return
    if (!textToSubmit.trim()) {
      textToSubmit = 'Style a great outfit using my selected items.'
    }

    triggerHaptic(hapticPatterns.light)

    // Check for existing similar outfits first
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const { data: duplicate } = await supabase
        .from('outfits')
        .select('id')
        .eq('user_id', session?.user?.id || '')
        .eq('prompt_text', textToSubmit)
        .eq('is_saved', false)
        .order('created_at', { ascending: false })
        .limit(1)

      if (duplicate && duplicate.length > 0) {
        setDuplicateOutfitId(duplicate[0].id)
        setExistingMatch({ id: duplicate[0].id, occasion: textToSubmit })
        setPendingPrompt(textToSubmit)
        setShowDuplicateModal(true)
        return
      }
    } catch (err) {
      console.warn('Failed to check existing outfits', err)
    }

    proceedWithStyle(textToSubmit, capsuleId)
  }

  const proceedWithStyle = (textToSubmit: string, capsuleId?: string) => {
    // Check cache
    try {
      const cached = localStorage.getItem('weatherContextCache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Date.now() - parsed.timestamp < 2 * 60 * 60 * 1000) {
          executeGeneration(textToSubmit, parsed.context, capsuleId)
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
          executeGeneration(textToSubmit, context, capsuleId)
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

  const handleContextConfirm = () => {
    const context = {
      city: manualCity || 'Unknown',
      temperature: parseInt(manualTemp) || 20,
      condition: manualCond || 'Clear'
    }
    setContextData(context)
    localStorage.setItem('weatherContextCache', JSON.stringify({ timestamp: Date.now(), context }))
    setShowContextModal(false)
    executeGeneration(prompt, context, selectedCapsuleId)
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
    const autoRun = searchParams.get('auto') === 'true'
    const itemsParam = searchParams.get('items')
    
    // Fetch base items if they exist
    if (itemsParam) {
      const ids = itemsParam.split(',')
      const fetchBaseItems = async () => {
        const supabase = createClient()
        const { data } = await supabase.from('wardrobe_items').select('*').in('id', ids)
        if (data) setBaseItems(data)
      }
      fetchBaseItems()
    }

    if (queryPrompt && autoRun && !hasAutoRun.current) {
      hasAutoRun.current = true
      setPrompt(queryPrompt)
      // Remove query params from URL so back-navigation doesn't re-trigger it
      window.history.replaceState(null, '', '/style')
      handleInitialStyleClick(undefined, queryPrompt)
    } else if (queryPrompt && !hasAutoRun.current) {
      setPrompt(queryPrompt)
      window.history.replaceState(null, '', '/style')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleChipClick = (chip: string) => {
    triggerHaptic(hapticPatterns.light)
    const text = `Get me ready for a ${chip.toLowerCase()}`
    setPrompt(text)
    handleInitialStyleClick(undefined, text)
  }

  if (wardrobeCount === null) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Styling Hub</h1>
      </header>

      {wardrobeCount === 0 ? (
        <section className={styles.heroCard} style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div className={styles.glow} />
          <div style={{ marginBottom: '16px', color: '#c8a55a' }}><Shirt size={48} /></div>
          <h2>Your Wardrobe is Empty</h2>
          <p style={{ marginBottom: '24px', opacity: 0.8 }}>Add some clothes to your digital wardrobe before our AI can style you.</p>
          <Link href="/wardrobe/add" className={styles.primaryButton} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#c8a55a', color: '#1E1E24', borderRadius: '8px', fontWeight: 600 }}>
            Add Your First Item
          </Link>
        </section>
      ) : (
        <>
          {/* Hero Action */}
          <section className={styles.heroCard}>
        <div className={styles.glow} />
        <h2>What's the occasion?</h2>
        <p>Describe your event or mood, and AI will craft the perfect look.</p>
        
        <div className={styles.modeToggle}>
          <button 
            type="button" 
            className={`${styles.modeBtn} ${mode === 'daily' ? styles.modeBtnActive : ''}`}
            onClick={() => setMode('daily')}
          >
            Daily Look
          </button>
          <button 
            type="button" 
            className={`${styles.modeBtn} ${mode === 'capsule' ? styles.modeBtnActive : ''}`}
            onClick={() => setMode('capsule')}
          >
            Travel Capsule
          </button>
        </div>

        {mode === 'daily' ? (
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              handleInitialStyleClick(undefined, prompt, selectedCapsuleId)
            }} 
            className={styles.form}
          >
            <textarea 
              className={styles.promptInput}
              placeholder="E.g., I'm going to a rooftop dinner in a slightly chilly city..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
            
            {savedCapsules.length > 0 && (
              <div className={styles.inputGroup} style={{ marginTop: '-8px', marginBottom: '8px' }}>
                <label>Styling Source</label>
                <select 
                  value={selectedCapsuleId} 
                  onChange={(e) => setSelectedCapsuleId(e.target.value)}
                  className={styles.selectInput}
                >
                  <option value="">Entire Wardrobe</option>
                  {savedCapsules.map((capsule: any) => (
                    <option key={capsule.id} value={capsule.id}>Capsule: {capsule.title}</option>
                  ))}
                </select>
              </div>
            )}
            
            <button 
              type="submit"
              className={`${styles.styleBtn} ${(!prompt.trim() && baseItems.length === 0) || isGenerating ? styles.styleBtnDisabled : ''}`}
              disabled={(!prompt.trim() && baseItems.length === 0) || isGenerating}
            >
              {isGenerating ? 'Curating Look...' : <>Style Me <Sparkles size={16} style={{display: 'inline', verticalAlign: 'text-bottom', marginLeft: 4}} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCapsuleGenerate} className={styles.capsuleForm}>
            <div className={styles.inputGroup}>
              <label>Destinations</label>
              <input 
                type="text" 
                placeholder="e.g. Paris & Rome"
                value={destinations}
                onChange={(e) => setDestinations(e.target.value)}
                className={styles.textInput}
              />
            </div>
            
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label>Days</label>
                <input 
                  type="number" 
                  placeholder="e.g. 7"
                  min="1"
                  max="30"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className={styles.textInput}
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Bag Capacity (Liters)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 40"
                  min="10"
                  max="120"
                  value={bagSize} 
                  onChange={(e) => setBagSize(e.target.value)}
                  className={styles.textInput}
                />
              </div>
            </div>

            <button 
              type="submit"
              className={`${styles.styleBtn} ${(!destinations.trim() || !days) || isGenerating ? styles.styleBtnDisabled : ''}`}
              disabled={!destinations.trim() || !days || isGenerating}
            >
              {isGenerating ? 'Curating Capsule...' : <>Generate Capsule <Sparkles size={16} style={{display: 'inline', verticalAlign: 'text-bottom', marginLeft: 4}} /></>}
            </button>
          </form>
        )}

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
            <div className={styles.ootdIcon}><Briefcase size={32} /></div>
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
                    <div className={styles.miniItem}><Sparkles size={16} /></div>
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

          {/* Saved Capsules Preview */}
          <section className={styles.savedSection}>
            <div className={styles.savedHeader}>
              <h3 className={styles.sectionTitle}>Saved Capsules</h3>
              {savedCapsules.length > 0 && (
                <Link href="/style/saved?tab=capsules" className={styles.seeAll}>
                  View All
                </Link>
              )}
            </div>
            
            {savedCapsules.length > 0 ? (
              <div className={styles.savedScroll}>
                {savedCapsules.map(capsule => (
                  <Link href={`/style/capsule/${capsule.id}`} key={capsule.id} className={styles.savedCard} style={{ textDecoration: 'none' }}>
                    <div className={styles.savedVisual}>
                      <div className={styles.miniItem}><Briefcase size={16} /></div>
                    </div>
                    <div className={styles.savedInfo}>
                      <h4>{capsule.destinations[0]} ({capsule.days}d)</h4>
                      <span>{getTimeAgo(capsule.created_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Globe size={32} opacity={0.5} />
                <p>No saved capsules yet</p>
              </div>
            )}
          </section>
        </>
      )}

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
                  <button className={styles.confirmBtn} onClick={handleContextConfirm}>
                    Confirm & Style Me <Sparkles size={16} style={{display: 'inline', verticalAlign: 'text-bottom', marginLeft: 4}} />
                  </button>
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
                  style={{ width: '100%', padding: '14px', background: 'transparent', color: 'var(--color-accent)', border: '1px solid var(--color-accent)' }}
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
