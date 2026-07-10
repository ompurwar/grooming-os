'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import LookCard from '@/components/styling/LookCard'
import { toast } from 'sonner'
import { triggerHaptic, hapticPatterns } from '@/utils/haptics'
import { Shirt, Footprints, Watch, ThumbsUp, ThumbsDown, RefreshCcw } from 'lucide-react'
import styles from './page.module.css'

interface OutfitData {
  id: string
  occasion: string
  confidence: number
  reasoning: string
  items: any[]
  capsuleInfo?: { id: string, title: string }
}

function GetReadyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const outfitId = searchParams.get('id')
  const autoTryOn = searchParams.get('autoTryOn') === 'true'
  
  const [isGenerating, setIsGenerating] = useState(true)
  const [outfitData, setOutfitData] = useState<OutfitData | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [savedAsLabel, setSavedAsLabel] = useState<string | undefined>(undefined)
  const [tryOnImageUrl, setTryOnImageUrl] = useState<string | null>(null)
  const [isGeneratingTryOn, setIsGeneratingTryOn] = useState<boolean | string>(false)
  
  const [isLoggingWear, setIsLoggingWear] = useState(false)
  const [hasLoggedWear, setHasLoggedWear] = useState(false)

  useEffect(() => {
    if (!outfitId) {
      setIsGenerating(false)
      return
    }

    async function fetchOutfit() {
      const supabase = createClient()
      
      const { data: outfit } = await supabase
        .from('outfits')
        .select(`
          *,
          capsules (
            id,
            title
          )
        `)
        .eq('id', outfitId)
        .single()

      if (!outfit) {
        setIsGenerating(false)
        return
      }

      const { data: outfitItems } = await supabase
        .from('outfit_items')
        .select(`
          id,
          wardrobe_items (
            id,
            category,
            sub_category,
            primary_color,
            image_url
          )
        `)
        .eq('outfit_id', outfitId)

      // Parse per-item reasoning if available (V2 Planner stores JSON)
      let perItemReasons: Record<string, string> = {}
      let overarchingReason = outfit.reasoning || 'This combination was selected specifically for your occasion.'
      
      try {
        const parsed = JSON.parse(outfit.reasoning || '')
        if (Array.isArray(parsed)) {
          // Old V2 format before fix
          parsed.forEach((r: any) => { perItemReasons[r.id] = r.reason })
          overarchingReason = 'This combination was selected specifically for your occasion.'
        } else if (parsed && typeof parsed === 'object' && parsed.overall) {
          // New V2 format
          overarchingReason = parsed.overall
          if (Array.isArray(parsed.items)) {
            parsed.items.forEach((r: any) => { perItemReasons[r.id] = r.reason })
          }
        }
      } catch {
        // V1 style — reasoning is plain text, not JSON
      }

      const mappedItems = (outfitItems || []).map(item => {
        const wItem = item.wardrobe_items as any
        let icon: any = Shirt
        if (wItem?.category === 'Bottom') icon = Shirt
        if (wItem?.category === 'Footwear') icon = Footprints
        if (wItem?.category === 'Outerwear') icon = Shirt
        if (wItem?.category === 'Accessory') icon = Watch

        return {
          type: wItem?.category || 'Top',
          icon,
          name: `${wItem?.primary_color || ''} ${wItem?.sub_category || wItem?.category || ''}`.trim(),
          source: 'From Wardrobe',
          imageUrl: wItem?.image_url,
          itemReasoning: perItemReasons[wItem?.id] || undefined
        }
      })

      setOutfitData({
        id: outfit.id,
        occasion: outfit.occasion || 'Your Custom Look',
        confidence: 95,
        reasoning: overarchingReason,
        items: mappedItems,
        capsuleInfo: outfit.capsules ? { id: outfit.capsules.id, title: outfit.capsules.title } : undefined
      })
      
      setIsSaved(outfit.is_saved)
      setTryOnImageUrl(outfit.try_on_image_url)
      if (outfit.vto_status === 'processing') {
        setIsGeneratingTryOn(true)
      }

      // Duplicate hash check
      if (outfit.items_hash && !outfit.is_saved) {
        const { data: duplicate } = await supabase
          .from('outfits')
          .select('occasion')
          .eq('user_id', outfit.user_id)
          .eq('items_hash', outfit.items_hash)
          .eq('is_saved', true)
          .neq('id', outfit.id)
          .limit(1)
          .single()

        if (duplicate) {
          setIsSaved(true)
          setSavedAsLabel(duplicate.occasion)
        }
      }
      
      setIsGenerating(false)
      triggerHaptic(hapticPatterns.success)

      // Supabase Realtime Subscription for Webhook VTO updates
      // Using a random string in the channel name prevents the "cannot add callbacks after subscribe()" error
      // which happens in React StrictMode when the channel is reused before it's fully cleaned up.
      const channel = supabase
        .channel(`outfits_vto_updates_${outfit.id}_${Math.random().toString(36).substring(7)}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'outfits', 
          filter: `id=eq.${outfit.id}` 
        }, (payload: any) => {
          if (payload.new.vto_status === 'completed' && payload.new.try_on_image_url) {
            setTryOnImageUrl(payload.new.try_on_image_url)
            setIsGeneratingTryOn(false)
            triggerHaptic(hapticPatterns.success)
          } else if (payload.new.vto_status === 'processing' && payload.new.vto_passes?.length > 0) {
            // Intermediate pass completed
            if (payload.new.try_on_image_url) {
              setTryOnImageUrl(payload.new.try_on_image_url)
            }
            // Update loading text
            const passes = payload.new.vto_passes
            const currentIdx = payload.new.vto_current_pass || 0
            if (currentIdx < passes.length) {
              setIsGeneratingTryOn(`Generating ${passes[currentIdx].passType}...` as any)
            }
          } else if (payload.new.vto_status === 'failed') {
            setIsGeneratingTryOn(false)
            toast.error('Virtual try-on failed to generate.')
            triggerHaptic(hapticPatterns.error)
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    const cleanup = fetchOutfit()
    
    return () => {
      cleanup.then(fn => fn && fn())
    }
  }, [outfitId, router])

  const handleSaveLook = async () => {
    if (!outfitData || isSaved) return
    setIsSaving(true)
    triggerHaptic(hapticPatterns.light)

    const supabase = createClient()
    const { error } = await supabase
      .from('outfits')
      .update({ is_saved: true })
      .eq('id', outfitData.id)

    if (!error) {
      setIsSaved(true)
      toast.success('Look saved to your favourites!')
      triggerHaptic(hapticPatterns.success)
    } else {
      toast.error('Failed to save look')
      triggerHaptic(hapticPatterns.error)
    }
    setIsSaving(false)
  }

  const handleTryAlternatives = () => {
    triggerHaptic(hapticPatterns.light)
    if (outfitData) {
      router.push('/style')
    } else {
      router.push('/style')
    }
  }

  const handleDeleteLook = async () => {
    if (!outfitData) return
    triggerHaptic(hapticPatterns.medium)
    const confirmDelete = window.confirm('Are you sure you want to delete this look?')
    if (!confirmDelete) return

    setIsSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('outfits')
      .delete()
      .eq('id', outfitData.id)

    if (!error) {
      toast.success('Look deleted')
      triggerHaptic(hapticPatterns.success)
      router.push('/style')
    } else {
      toast.error('Failed to delete look')
      triggerHaptic(hapticPatterns.error)
      setIsSaving(false)
    }
  }

  const handleFeedback = (type: string) => {
    triggerHaptic(hapticPatterns.medium)
    toast.success(`Feedback recorded: ${type}`)
  }

  const handleLogWear = async () => {
    if (!outfitData || hasLoggedWear) return
    setIsLoggingWear(true)
    triggerHaptic(hapticPatterns.light)
    try {
      const res = await fetch('/api/wardrobe/wear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfitId: outfitData.id })
      })
      if (!res.ok) throw new Error('Failed to log wear')
      setHasLoggedWear(true)
      toast.success('Awesome! Look logged as worn today.')
      triggerHaptic(hapticPatterns.success)
    } catch (err) {
      toast.error('Failed to log wear')
      triggerHaptic(hapticPatterns.error)
    } finally {
      setIsLoggingWear(false)
    }
  }

  const handleGenerateTryOn = async () => {
    if (!outfitData) return
    setIsGeneratingTryOn(true)
    triggerHaptic(hapticPatterns.light)
    
    try {
      const response = await fetch('/api/style/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfitId: outfitData.id })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.tryOnImageUrl) {
          setTryOnImageUrl(data.tryOnImageUrl)
          setIsGeneratingTryOn(false)
          triggerHaptic(hapticPatterns.success)
        } else if (data.status === 'processing') {
          // Job is running in background. Supabase realtime subscription will set isGeneratingTryOn(false) when done.
        } else {
          setIsGeneratingTryOn(false)
        }
      } else {
        setIsGeneratingTryOn(false)
        const data = await response.json()
        // If it's the specific missing photo error, show a more actionable toast
        if (data.error && data.error.includes('Body Scan onboarding')) {
          toast('Upload a body photo first', {
            description: 'You need to upload a front-facing photo in your profile for virtual try-on.',
            action: {
              label: 'Go to Profile',
              onClick: () => router.push('/profile/body')
            },
            duration: 8000
          })
          triggerHaptic(hapticPatterns.error)
        } else {
          toast.error(data.error || 'Failed to generate virtual try-on')
        }
      }
    } catch (error) {
      setIsGeneratingTryOn(false)
      console.error('Failed to generate try on', error)
      toast.error('Failed to connect to try-on service')
    }
  }

  // Trigger autoTryOn once outfit data is fully loaded
  useEffect(() => {
    if (autoTryOn && outfitData && !tryOnImageUrl && !isGeneratingTryOn) {
      // Remove query param so it doesn't loop on refresh
      window.history.replaceState(null, '', `/style/get-ready?id=${outfitData.id}`)
      handleGenerateTryOn()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfitData, autoTryOn])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/style" className={styles.backBtn} onClick={() => triggerHaptic(hapticPatterns.light)}>← Back</Link>
        <h1 className={styles.title}>Your Look</h1>
      </header>

      {isGenerating ? (
        <div className={styles.skeletonCard}>
          <div className={styles.skeletonHeader}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonBadge} />
          </div>
          <div className={styles.skeletonText} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            <div className={styles.skeletonItem}>
              <div className={styles.skeletonIcon} />
              <div className={styles.skeletonItemLine} />
            </div>
            <div className={styles.skeletonItem}>
              <div className={styles.skeletonIcon} />
              <div className={styles.skeletonItemLine} />
            </div>
            <div className={styles.skeletonItem}>
              <div className={styles.skeletonIcon} />
              <div className={styles.skeletonItemLine} />
            </div>
          </div>
        </div>
      ) : outfitData ? (
        <div className={styles.resultContainer}>
          <LookCard 
            {...outfitData} 
            onSave={handleSaveLook}
            onTryAlternatives={handleTryAlternatives}
            onDelete={handleDeleteLook}
            onGenerateTryOn={handleGenerateTryOn}
            isSaved={isSaved}
            savedAsLabel={savedAsLabel}
            tryOnImageUrl={tryOnImageUrl}
            isGeneratingTryOn={isGeneratingTryOn}
          />
          
          <div className={styles.feedbackSection}>
            <button 
              onClick={handleLogWear}
              disabled={hasLoggedWear || isLoggingWear}
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: hasLoggedWear ? 'var(--color-bg-tertiary)' : 'var(--color-accent)', 
                color: hasLoggedWear ? 'var(--color-text-tertiary)' : '#1E1E24', 
                borderRadius: '8px', 
                border: 'none', 
                fontWeight: 600, 
                marginBottom: '24px',
                cursor: hasLoggedWear ? 'default' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {isLoggingWear ? 'Logging...' : hasLoggedWear ? 'Worn Today ✓' : 'I Wore This Today'}
            </button>
            <p>How do you like this look?</p>
            <div className={styles.feedbackButtons}>
              <button className={styles.feedbackBtn} onClick={() => handleFeedback('Perfect')}><ThumbsUp size={16} style={{marginRight: 4, verticalAlign: 'text-bottom'}} /> Perfect</button>
              <button className={styles.feedbackBtn} onClick={() => handleFeedback('Tweak')}><RefreshCcw size={16} style={{marginRight: 4, verticalAlign: 'text-bottom'}} /> Tweak it</button>
              <button className={styles.feedbackBtn} onClick={() => handleFeedback('Not for me')}><ThumbsDown size={16} style={{marginRight: 4, verticalAlign: 'text-bottom'}} /> Not for me</button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.resultContainer}>
          <p>Look not found.</p>
        </div>
      )}
    </div>
  )
}

function SkeletonFallback() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.backBtn}>← Back</div>
        <h1 className={styles.title}>Your Look</h1>
      </header>
      <div className={styles.skeletonCard}>
        <div className={styles.skeletonHeader}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonBadge} />
        </div>
        <div className={styles.skeletonText} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
          <div className={styles.skeletonItem}>
            <div className={styles.skeletonIcon} />
            <div className={styles.skeletonItemLine} />
          </div>
          <div className={styles.skeletonItem}>
            <div className={styles.skeletonIcon} />
            <div className={styles.skeletonItemLine} />
          </div>
          <div className={styles.skeletonItem}>
            <div className={styles.skeletonIcon} />
            <div className={styles.skeletonItemLine} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GetReadyResults() {
  return (
    <Suspense fallback={<SkeletonFallback />}>
      <GetReadyContent />
    </Suspense>
  )
}
