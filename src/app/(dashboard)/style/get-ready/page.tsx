'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import LookCard from '@/components/styling/LookCard'
import styles from './page.module.css'

interface OutfitData {
  id: string
  occasion: string
  confidence: number
  reasoning: string
  items: any[]
}

export default function GetReadyResults() {
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
      
      // Fetch Outfit details
      const { data: outfit } = await supabase
        .from('outfits')
        .select('*')
        .eq('id', outfitId)
        .single()

      if (!outfit) {
        setIsGenerating(false)
        return
      }

      // Fetch Outfit Items joined with Wardrobe Items
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

      // Transform data for LookCard
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
        confidence: 95, // Hardcoded for now
        reasoning: outfit.reasoning || 'This combination was selected specifically for your occasion.',
        items: mappedItems
      })
      
      setIsSaved(outfit.is_saved)
      
      setIsGenerating(false)
    }

    fetchOutfit()
  }, [outfitId])

  const handleSaveLook = async () => {
    if (!outfitData) return
    setIsSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('outfits')
      .update({ is_saved: true })
      .eq('id', outfitData.id)

    if (!error) {
      setIsSaved(true)
    } else {
      alert('Failed to save look')
    }
    setIsSaving(false)
  }

  const handleTryAlternatives = () => {
    router.back()
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/style" className={styles.backBtn}>← Back</Link>
        <h1 className={styles.title}>Your Look</h1>
      </header>

      {isGenerating ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <h2>Crafting your look...</h2>
          <div className={styles.loadingSteps}>
            <p className={styles.stepDone}>✓ Analyzing weather and occasion</p>
            <p className={styles.stepDone}>✓ Scanning your wardrobe</p>
            <p className={styles.stepActive}>◌ Mixing and matching items</p>
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
              <button className={styles.feedbackBtn}>👍 Perfect</button>
              <button className={styles.feedbackBtn}>🔄 Tweak it</button>
              <button className={styles.feedbackBtn}>👎 Not for me</button>
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
