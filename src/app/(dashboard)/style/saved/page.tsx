'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import LookCard from '@/components/styling/LookCard'
import styles from './page.module.css'

const SLOT_ICONS: Record<string, string> = {
  Top: '👔',
  Bottom: '👖',
  Footwear: '👟',
  Accessory: '💍',
  Hairstyle: '💇',
  Upgrade: '🛒',
}

export default function SavedLooks() {
  const router = useRouter()
  const [savedOutfits, setSavedOutfits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSaved() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setLoading(false)
        return
      }
      const userId = session.user.id

      // Step 1: Fetch saved outfits
      const { data: outfits, error: outfitErr } = await supabase
        .from('outfits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_saved', true)
        .order('created_at', { ascending: false })

      if (outfitErr) {
        console.error('Error fetching saved outfits:', JSON.stringify(outfitErr))
        setLoading(false)
        return
      }

      if (!outfits || outfits.length === 0) {
        setSavedOutfits([])
        setLoading(false)
        return
      }

      // Step 2: For each outfit, fetch its items joined with wardrobe_items
      const mapped = await Promise.all(
        outfits.map(async (outfit: any) => {
          const { data: outfitItems } = await supabase
            .from('outfit_items')
            .select(`
              id, slot,
              wardrobe_items (
                id, category, sub_category, primary_color, image_url
              )
            `)
            .eq('outfit_id', outfit.id)

          const items = (outfitItems || []).map((oi: any) => {
            const w = oi.wardrobe_items as any
            const cat = w?.category || oi.slot || 'Item'
            return {
              type: cat,
              slot: oi.slot || cat,
              name: `${w?.primary_color || ''} ${w?.sub_category || w?.category || 'Item'}`.trim(),
              source: 'Your Wardrobe',
              imageUrl: w?.image_url || undefined,
              icon: SLOT_ICONS[cat] || '👔',
            }
          })

          return {
            id: outfit.id,
            occasion: outfit.occasion || 'Untitled Look',
            confidence: outfit.confidence_score ?? 85,
            reasoning: outfit.reasoning || '',
            createdAt: outfit.created_at,
            items,
          }
        })
      )

      setSavedOutfits(mapped)
      setLoading(false)
    }
    fetchSaved()
  }, [])

  const handleDelete = async (outfitId: string) => {
    const supabase = createClient()
    await supabase.from('outfits').update({ is_saved: false }).eq('id', outfitId)
    setSavedOutfits((prev) => prev.filter((o) => o.id !== outfitId))
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        Loading saved looks…
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => router.back()}>
        ← Back
      </button>
      <h1 className={styles.title}>My Saved Looks</h1>
      <p className={styles.subtitle}>{savedOutfits.length} look{savedOutfits.length !== 1 ? 's' : ''} saved</p>

      {savedOutfits.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📋</span>
          You haven't saved any looks yet.
          <br />
          <Link href="/style" className={styles.emptyAction}>
            Style Me ✨
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {savedOutfits.map((outfit) => (
            <LookCard
              key={outfit.id}
              occasion={outfit.occasion}
              confidence={outfit.confidence}
              items={outfit.items}
              reasoning={outfit.reasoning}
              isSaved={true}
              onTryAlternatives={() => router.push('/style')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
