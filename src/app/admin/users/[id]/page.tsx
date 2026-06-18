'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { isAdminEmail } from '@/utils/admin'
import Image from 'next/image'
import { ArrowLeft, Shield, Shirt, Sparkles } from 'lucide-react'
import LookCard from '@/components/styling/LookCard'
import styles from './page.module.css'

interface UserDetails {
  user: {
    id: string
    email: string
    fullName: string | null
    joinedAt: string
  }
  wardrobe: any[]
  outfits: any[]
  profiles: {
    body: any | null
    face: any | null
  }
}

export default function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const userId = resolvedParams.id
  
  const router = useRouter()
  const [data, setData] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user || !isAdminEmail(session.user.email)) {
        setError('Access Denied')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/admin/users/${userId}`)
        if (!res.ok) {
          setError(res.status === 404 ? 'User not found' : 'Failed to fetch user data')
          setLoading(false)
          return
        }
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Error:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [userId])

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>Loading user profile…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={styles.errorScreen}>
        <Shield size={48} />
        <h1 className={styles.title}>{error || 'Error'}</h1>
        <button onClick={() => router.push('/admin')} className={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    )
  }

  const { user, wardrobe, outfits, profiles } = data

  // Map outfits to the shape LookCard expects
  const formattedOutfits = outfits.map(outfit => {
    const items = (outfit.outfit_items || []).map((oi: any) => {
      const w = oi.wardrobe_items
      const cat = w?.category || oi.slot || 'Item'
      return {
        type: cat,
        slot: oi.slot || cat,
        name: `${w?.primary_color || ''} ${w?.sub_category || w?.category || 'Item'}`.trim(),
        source: 'Your Wardrobe',
        imageUrl: w?.image_url || undefined,
        icon: Shirt,
      }
    })
    return {
      ...outfit,
      mappedItems: items
    }
  })

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button onClick={() => router.push('/admin')} className={styles.backLink}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className={styles.title}>User Details</h1>
          <p className={styles.subtitle}>ID: {user.id}</p>
        </div>
      </header>

      {/* Profile Overview */}
      <div className={styles.profileCard}>
        <div className={styles.avatar}>
          {(user.fullName || user.email)[0].toUpperCase()}
        </div>
        <div className={styles.profileInfo}>
          <h2 className={styles.userName}>{user.fullName || 'No Name Provided'}</h2>
          <p className={styles.userEmail}>{user.email}</p>
          <div className={styles.statsRow}>
            <span className={styles.statBadge}>
              Joined <span className={styles.statValue}>{new Date(user.joinedAt).toLocaleDateString()}</span>
            </span>
            <span className={styles.statBadge}>
              <Shirt size={14} /> <span className={styles.statValue}>{wardrobe.length}</span> Items
            </span>
            <span className={styles.statBadge}>
              <Sparkles size={14} /> <span className={styles.statValue}>{outfits.length}</span> Looks
            </span>
          </div>
        </div>
      </div>

      {/* Profiles Data (Body/Face) */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Biometric Profiles</h2>
        </div>
        <div className={styles.profilesGrid}>
          {/* Body Profile */}
          <div className={styles.infoCard}>
            <h3>Body Scan</h3>
            {profiles.body ? (
              <>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Body Type</span>
                  <span className={styles.infoValue}>{profiles.body.body_type || '—'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Features</span>
                  <span className={styles.infoValue}>
                    {profiles.body.features ? profiles.body.features.join(', ') : '—'}
                  </span>
                </div>
              </>
            ) : (
              <p className={styles.subtitle}>No body scan completed.</p>
            )}
          </div>

          {/* Face Profile */}
          <div className={styles.infoCard}>
            <h3>Face Scan</h3>
            {profiles.face ? (
              <>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Face Shape</span>
                  <span className={styles.infoValue}>{profiles.face.face_shape || '—'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Skin Tone</span>
                  <span className={styles.infoValue}>{profiles.face.skin_tone_category || '—'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Undertone</span>
                  <span className={styles.infoValue}>{profiles.face.skin_undertone || '—'}</span>
                </div>
              </>
            ) : (
              <p className={styles.subtitle}>No face scan completed.</p>
            )}
          </div>
        </div>
      </section>

      {/* Wardrobe Items */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Wardrobe <span className={styles.sectionCount}>{wardrobe.length}</span>
          </h2>
        </div>
        {wardrobe.length === 0 ? (
          <div className={styles.emptyState}>No active wardrobe items.</div>
        ) : (
          <div className={styles.wardrobeGrid}>
            {wardrobe.map(item => (
              <div key={item.id} className={styles.itemCard}>
                <div className={styles.itemImageWrap}>
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.category} fill sizes="180px" />
                  ) : (
                    <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      <Shirt size={32} opacity={0.2} />
                    </div>
                  )}
                </div>
                <div className={styles.itemInfo}>
                  <div className={styles.itemCategory}>{item.category}</div>
                  <div className={styles.itemName}>
                    {item.primary_color} {item.sub_category || item.category}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Generated Looks */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Generated Looks <span className={styles.sectionCount}>{formattedOutfits.length}</span>
          </h2>
        </div>
        {formattedOutfits.length === 0 ? (
          <div className={styles.emptyState}>No looks generated yet.</div>
        ) : (
          <div className={styles.outfitsGrid}>
            {formattedOutfits.map(outfit => (
              <LookCard
                key={outfit.id}
                occasion={outfit.occasion || 'Untitled Look'}
                confidence={outfit.confidence_score ?? 85}
                items={outfit.mappedItems}
                reasoning={outfit.reasoning || ''}
                isSaved={outfit.is_saved}
                // We intentionally don't pass handlers here because admin is just viewing
              />
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
