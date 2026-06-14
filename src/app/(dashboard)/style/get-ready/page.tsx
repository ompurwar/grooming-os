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
  
  const [isGenerating, setIsGenerating] = useState(true)
  const [outfitData, setOutfitData] = useState<OutfitData | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [savedAsLabel, setSavedAsLabel] = useState<string | undefined>(undefined)
  const [tryOnImageUrl, setTryOnImageUrl] = useState<string | null>(null)
  const [isGeneratingTryOn, setIsGeneratingTryOn] = useState(false)

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
          imageUrl: wItem?.image_url
        }
      })

      setOutfitData({
        id: outfit.id,
        occasion: outfit.occasion || 'Your Custom Look',
        confidence: 95,
        reasoning: outfit.reasoning || 'This combination was selected specifically for your occasion.',
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
      const channel = supabase
        .channel(`outfits_vto_updates_${outfit.id}`)
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
          triggerHaptic(hapticPatterns.success)
        }
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to generate virtual try-on')
      }
    } catch (error) {
      console.error('Failed to generate try on', error)
      toast.error('Failed to connect to try-on service')
    } finally {
      setIsGeneratingTryOn(false)
    }
  }

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
