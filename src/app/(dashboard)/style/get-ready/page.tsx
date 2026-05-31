'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import LookCard from '@/components/styling/LookCard'
import { toast } from 'sonner'
import { triggerHaptic, hapticPatterns } from '@/utils/haptics'
import styles from './page.module.css'

interface OutfitData {
  id: string
  occasion: string
  confidence: number
  reasoning: string
  items: any[]
}

function GetReadyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const outfitId = searchParams.get('id')
  
  const [isGenerating, setIsGenerating] = useState(true)
  const [outfitData, setOutfitData] = useState<OutfitData | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    if (!outfitId) {
      setIsGenerating(false)
      return
    }

    async function fetchOutfit() {
      const supabase = createClient()
      
      const { data: outfit } = await supabase
        .from('outfits')
        .select('*')
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
        let icon = '👔'
        if (wItem?.category === 'Bottom') icon = '👖'
        if (wItem?.category === 'Footwear') icon = '👞'
        if (wItem?.category === 'Outerwear') icon = '🧥'

        return {
          type: wItem?.category || 'Top',
          icon,
          name: `${wItem?.primary_color} ${wItem?.sub_category || wItem?.category}`,
          source: 'From Wardrobe',
          imageUrl: wItem?.image_url
        }
      })

      setOutfitData({
        id: outfit.id,
        occasion: outfit.occasion || 'Your Custom Look',
        confidence: 95,
        reasoning: outfit.reasoning || 'This combination was selected specifically for your occasion.',
        items: mappedItems
      })
      
      setIsSaved(outfit.is_saved)
      
      setIsGenerating(false)
      triggerHaptic(hapticPatterns.success)
    }

    fetchOutfit()
  }, [outfitId])

  const handleSaveLook = async () => {
    if (!outfitData) return
    triggerHaptic(hapticPatterns.light)
    setIsSaving(true)
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
    router.back()
  }

  const handleFeedback = (type: string) => {
    triggerHaptic(hapticPatterns.medium)
    toast.success(`Feedback recorded: ${type}`)
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
            isSaved={isSaved}
          />
          
          <div className={styles.feedbackSection}>
            <p>How do you like this look?</p>
            <div className={styles.feedbackButtons}>
              <button className={styles.feedbackBtn} onClick={() => handleFeedback('Perfect')}>👍 Perfect</button>
              <button className={styles.feedbackBtn} onClick={() => handleFeedback('Tweak')}>🔄 Tweak it</button>
              <button className={styles.feedbackBtn} onClick={() => handleFeedback('Not for me')}>👎 Not for me</button>
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
