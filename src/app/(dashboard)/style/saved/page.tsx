'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import LookCard from '@/components/styling/LookCard'
import { Shirt, Footprints, Watch, Scissors, ShoppingCart, ClipboardList, Sparkles, Briefcase } from 'lucide-react'
import styles from './page.module.css'

const SLOT_ICONS: Record<string, any> = {
  Top: Shirt,
  Bottom: Shirt,
  Footwear: Footprints,
  Accessory: Watch,
  Hairstyle: Scissors,
  Upgrade: ShoppingCart,
}

function SavedStylesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') === 'capsules' ? 'capsules' : 'looks'
  
  const [activeTab, setActiveTab] = useState<'looks' | 'capsules'>(initialTab)
  const [savedOutfits, setSavedOutfits] = useState<any[]>([])
  const [savedCapsules, setSavedCapsules] = useState<any[]>([])
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

      if (activeTab === 'looks') {
        const { data: outfits, error: outfitErr } = await supabase
          .from('outfits')
          .select('*')
          .eq('user_id', userId)
          .eq('is_saved', true)
          .order('created_at', { ascending: false })

        if (outfitErr || !outfits || outfits.length === 0) {
          setSavedOutfits([])
          setLoading(false)
          return
        }

        const mapped = await Promise.all(
          outfits.map(async (outfit: any) => {
            const { data: outfitItems } = await supabase
              .from('outfit_items')
              .select(`
                slot,
                wardrobe_items ( id, category, primary_color, image_url )
              `)
              .eq('outfit_id', outfit.id)

            const formattedItems = (outfitItems || []).map((oi: any) => ({
              slot: oi.slot,
              category: oi.wardrobe_items.category,
              color: oi.wardrobe_items.primary_color,
              image: oi.wardrobe_items.image_url,
              icon: SLOT_ICONS[oi.slot] || Shirt
            }))

            return {
              id: outfit.id,
              occasion: outfit.occasion,
              confidence: outfit.confidence_score,
              reasoning: outfit.reasoning,
              items: formattedItems
            }
          })
        )

        setSavedOutfits(mapped)
      } else {
        const res = await fetch('/api/style/capsules')
        const data = await res.json()
        setSavedCapsules(data.capsules || [])
      }

      setLoading(false)
    }

    fetchSaved()
  }, [activeTab])

  const handleDelete = async (outfitId: string) => {
    const supabase = createClient()
    await supabase.from('outfits').delete().eq('id', outfitId)
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
      <h1 className={styles.title}>My Saved Styles</h1>
      <p className={styles.subtitle}>
        {activeTab === 'looks' 
          ? `${savedOutfits.length} look${savedOutfits.length !== 1 ? 's' : ''} saved`
          : `${savedCapsules.length} capsule${savedCapsules.length !== 1 ? 's' : ''} saved`
        }
      </p>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'looks' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('looks')}
        >
          Looks
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'capsules' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('capsules')}
        >
          Capsules
        </button>
      </div>

      {activeTab === 'looks' ? (
        savedOutfits.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}><ClipboardList size={32} /></span>
            You haven't saved any looks yet.
            <br />
            <Link href="/style" className={styles.emptyAction}>
              Style Me <Sparkles size={16} style={{display: 'inline', verticalAlign: 'text-bottom', marginLeft: 4}}/>
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
                onDelete={() => handleDelete(outfit.id)}
              />
            ))}
          </div>
        )
      ) : (
        savedCapsules.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}><Briefcase size={32} /></span>
            You haven't saved any capsules yet.
            <br />
            <Link href="/style" className={styles.emptyAction}>
              Plan a Trip <Sparkles size={16} style={{display: 'inline', verticalAlign: 'text-bottom', marginLeft: 4}}/>
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {savedCapsules.map((capsule) => (
              <Link href={`/style/capsule/${capsule.id}`} key={capsule.id} className={styles.savedCapsuleCard}>
                <div className={styles.capsuleIcon}>
                  <Briefcase size={24} />
                </div>
                <div className={styles.capsuleInfo}>
                  <h4>{capsule.destinations[0]} ({capsule.days} Days)</h4>
                  <p>{new Date(capsule.created_at).toLocaleDateString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}

export default function SavedLooks() {
  return (
    <Suspense fallback={<div className={styles.container}><div className={styles.loading}><div className={styles.spinner} /></div></div>}>
      <SavedStylesContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'
