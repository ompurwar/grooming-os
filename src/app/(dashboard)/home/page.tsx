'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'

import { Wine, Briefcase, Coffee, PartyPopper, Dumbbell, ShoppingCart, User, Shirt, Sparkles, BarChart3, Camera, Scissors, ClipboardList } from 'lucide-react'

const POPULAR_OCCASIONS = [
  { id: 'dinner_date', label: 'Dinner Date', icon: Wine },
  { id: 'office', label: 'Office', icon: Briefcase },
  { id: 'casual_friday', label: 'Casual Friday', icon: Coffee },
  { id: 'wedding', label: 'Wedding Guest', icon: PartyPopper },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'weekend', label: 'Weekend Errands', icon: ShoppingCart },
]

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [baseItems, setBaseItems] = useState<any[]>([])
  const [stats, setStats] = useState({ wardrobeCount: 0, outfitCount: 0, name: 'Explorer' })
  const [greeting] = useState(getGreeting)

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      
      const userId = session.user.id

      try {
        const { data: profile } = await supabase.from('users').select('full_name, onboarding_completed, age_range').eq('id', userId).maybeSingle()

        if (profile && profile.onboarding_completed === false) {
          if (!profile.age_range) {
            router.push('/onboarding/basic-info')
            return
          }
          
          const { data: stylePrefs } = await supabase.from('style_preferences').select('id').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
          if (!stylePrefs) {
            router.push('/onboarding/style-quiz')
            return
          }
          
          const { data: bodyProfile } = await supabase.from('body_profiles').select('id').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
          if (!bodyProfile) {
            router.push('/onboarding/body-scan')
            return
          }
          
          const { data: faceProfile } = await supabase.from('face_profiles').select('id').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
          if (!faceProfile) {
            router.push('/onboarding/face-scan')
            return
          }
          
          router.push('/onboarding/wardrobe-seed')
          return
        }

        const { count: wCount } = await supabase.from('wardrobe_items').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true)
        const { count: oCount } = await supabase.from('outfits').select('*', { count: 'exact', head: true }).eq('user_id', userId)

        setStats({
          name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Explorer',
          wardrobeCount: wCount || 0,
          outfitCount: oCount || 0
        })
      } catch (err) {
        console.error('Error fetching dashboard stats', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    async function fetchBaseItems() {
      const itemsParam = searchParams.get('items')
      if (itemsParam) {
        const itemIds = itemsParam.split(',')
        const supabase = createClient()
        const { data: bItems } = await supabase
          .from('wardrobe_items')
          .select('*')
          .in('id', itemIds)
        if (bItems) {
          setBaseItems(bItems)
        }
      }
    }
    fetchBaseItems()
  }, [searchParams])

  const handleStyleMe = (e: React.FormEvent) => {
    e.preventDefault()
    
    let finalPrompt = prompt
    if (!finalPrompt.trim() && baseItems.length > 0) {
      finalPrompt = 'Style a great outfit using my selected items.'
    }
    if (!finalPrompt.trim()) return

    const itemsQuery = baseItems.length > 0 ? `&items=${baseItems.map(i => i.id).join(',')}` : ''
    router.push(`/style?prompt=${encodeURIComponent(finalPrompt)}&auto=true${itemsQuery}`)
  }

  const handleOccasionClick = (occasionLabel: string) => {
    setPrompt(`Get me ready for a ${occasionLabel.toLowerCase()}`)
  }

  return (
    <div className={styles.container}>
      <header id="tour-home-overview" className={styles.header}>
        <div className={styles.greeting}>
          <h1 className={styles.title}>{greeting}, {stats.name}</h1>
          <p className={styles.subtitle}>What would you like to wear today?</p>
        </div>
        <Link href="/profile" className={styles.avatar} style={{ color: 'inherit' }}>
          <User size={24} />
        </Link>
      </header>

      {/* Main Action - Get Me Ready */}
      <section className={styles.heroSection}>
        <div className={styles.heroCard}>
          <div className={styles.heroGlow} />
          <h2 className={styles.heroTitle}><Sparkles size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Get Me Ready</h2>
          
          <form onSubmit={handleStyleMe} className={styles.promptForm}>
            {baseItems.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', alignSelf: 'center', marginRight: '4px' }}>Including:</span>
                {baseItems.map(item => (
                  <div key={item.id} style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--color-glass-border)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image_url} alt={item.category} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
            <input
              type="text"
              className={styles.promptInput}
              placeholder="Tell me the occasion or mood..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                type="submit"
                className={`${styles.styleButton} ${(!prompt.trim() && baseItems.length === 0) ? styles.styleButtonDisabled : ''}`}
                disabled={!prompt.trim() && baseItems.length === 0}
                style={{ flex: 1, width: 'auto' }}
              >
                Style Me
              </button>
              <Link
                href="/wardrobe?select=true&returnTo=home"
                className={styles.styleButton}
                style={{ 
                  background: 'var(--color-bg-tertiary)', 
                  color: 'var(--color-text-primary)', 
                  border: '1px solid var(--color-border)', 
                  flex: '0 0 auto', 
                  width: 'auto',
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Start with a specific item from your wardrobe"
              >
                <Shirt size={20} />
              </Link>
            </div>
          </form>

          <div className={styles.occasionsGrid}>
            {POPULAR_OCCASIONS.map((occ) => (
              <button
                key={occ.id}
                type="button"
                className={styles.occasionPill}
                onClick={() => handleOccasionClick(occ.label)}
              >
                <span><occ.icon size={16} /></span> {occ.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className={styles.statsSection}>
        <div className={styles.statsScroll}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}><Shirt size={24} /></span>
            <div className={styles.statInfo}>
              {isLoading ? (
                <span className={styles.skeleton} style={{ width: '40px', height: '22px' }} />
              ) : (
                <span className={styles.statValue}>{stats.wardrobeCount}</span>
              )}
              <span className={styles.statLabel}>Wardrobe Items</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}><Sparkles size={24} /></span>
            <div className={styles.statInfo}>
              {isLoading ? (
                <span className={styles.skeleton} style={{ width: '40px', height: '22px' }} />
              ) : (
                <span className={styles.statValue}>{stats.outfitCount}</span>
              )}
              <span className={styles.statLabel}>Outfits Styled</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}><BarChart3 size={24} /></span>
            <div className={styles.statInfo}>
              {isLoading ? (
                <span className={styles.skeleton} style={{ width: '40px', height: '22px' }} />
              ) : (
                <span className={styles.statValue}>8.5</span>
              )}
              <span className={styles.statLabel}>Style Score</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className={styles.quickActionsSection}>
        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.actionsGrid}>
          <Link href="/wardrobe/add" className={styles.actionCard}>
            <div className={styles.actionIconWrapper}>
              <span className={styles.actionIcon}><Camera size={24} /></span>
            </div>
            <span className={styles.actionLabel}>Add to Wardrobe</span>
          </Link>
          <Link href="/groom" className={styles.actionCard}>
            <div className={styles.actionIconWrapper}>
              <span className={styles.actionIcon}><Scissors size={24} /></span>
            </div>
            <span className={styles.actionLabel}>Grooming Tips</span>
          </Link>
          <Link href="/style/marketplace" className={styles.actionCard}>
            <div className={styles.actionIconWrapper}>
              <span className={styles.actionIcon}><ShoppingCart size={24} /></span>
            </div>
            <span className={styles.actionLabel}>Smart Shop</span>
          </Link>
          <Link href="/style/saved" className={styles.actionCard}>
            <div className={styles.actionIconWrapper}>
              <span className={styles.actionIcon}><ClipboardList size={24} /></span>
            </div>
            <span className={styles.actionLabel}>My Looks</span>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className={styles.container}><div className={styles.heroCard}><div style={{textAlign: 'center', opacity: 0.5}}>Loading...</div></div></div>}>
      <HomeContent />
    </Suspense>
  )
}
