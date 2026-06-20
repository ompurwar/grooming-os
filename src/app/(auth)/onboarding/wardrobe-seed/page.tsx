'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Camera } from 'lucide-react'
import styles from './page.module.css'

type CapturingState = 'idle' | 'capturing' | 'tagging'

export default function WardrobeSeedPage() {
  const router = useRouter()
  const [items, setItems] = useState<{ id: number; url: string; category: string }[]>([])
  const [state, setState] = useState<CapturingState>('idle')
  const [mockId, setMockId] = useState(1)

  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    e.target.value = ''
    
    setState('capturing')
    
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      setState('tagging')
      
      const fileExt = 'jpg'
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `uploads/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('wardrobe-images')
        .upload(filePath, file)

      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage
        .from('wardrobe-images')
        .getPublicUrl(filePath)

      const res = await fetch('/api/analyze/wardrobe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: publicUrl, userId: session.user.id })
      })

      const result = await res.json()
      if (!result.success) throw new Error(result.error)

      setItems(prev => [...prev, {
        id: result.data.id || mockId,
        url: publicUrl,
        category: result.data.category,
      }])
      setMockId(prev => prev + 1)

    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to analyze image')
    } finally {
      setState('idle')
    }
  }

  const handleFinish = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        await supabase
          .from('users')
          .update({ onboarding_completed: true })
          .eq('id', session.user.id)
      }
    } catch (err) {
      console.error('Failed to update onboarding status', err)
    }
    
    router.push('/home')
  }

  return (
    <div className={styles.container}>
      <div className={styles.bgOrb1} />

      <div className={styles.content}>
        {/* Progress */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: '100%' }} />
        </div>
        <p className={styles.progressLabel}>Step 5 of 5</p>

        <h1 className={styles.title}>Seed Your Wardrobe</h1>
        <p className={styles.subtitle}>
          Add a few favorite items to start. Our AI will auto-tag them.
        </p>

        {/* Capture Area */}
        <div className={styles.captureArea}>
          {state === 'idle' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />
              <button className={styles.captureButton} onClick={() => cameraInputRef.current?.click()}>
                <div className={styles.cameraIcon}><Camera size={32} /></div>
                <span>Tap to photograph an item</span>
                <p className={styles.captureHelp}>Lay flat or hang against a plain background</p>
              </button>
              
              <label className={styles.captureButton} style={{ cursor: 'pointer', padding: '12px', minHeight: 'auto' }}>
                <span style={{ fontSize: '14px' }}>Or upload from gallery</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          ) : (
            <div className={styles.processingArea}>
              <div className={styles.spinner} />
              <p>{state === 'capturing' ? 'Analyzing image...' : 'AI is tagging item...'}</p>
            </div>
          )}
        </div>

        {/* Captured Items Grid */}
        <div className={styles.itemsSection}>
          <div className={styles.itemsHeader}>
            <h3>Added Items ({items.length})</h3>
            <span className={styles.targetText}>Aim for 5+ items</span>
          </div>
          
          <div className={styles.itemsGrid}>
            {items.map(item => (
              <div key={item.id} className={styles.itemCard}>
                <div className={styles.itemImagePlaceholder}>
                  {item.category.charAt(0)}
                </div>
                <div className={styles.itemTag}>{item.category}</div>
              </div>
            ))}
            
            {/* Empty slots placeholders to encourage adding more */}
            {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, i) => (
              <div key={`empty-${i}`} className={styles.emptySlot}>
                +
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className={styles.footer}>
          <button
            id="finish-onboarding"
            className={`${styles.ctaButton} ${items.length === 0 ? styles.ctaDisabled : ''}`}
            onClick={handleFinish}
            disabled={items.length === 0}
          >
            Go to Dashboard
            <span className={styles.ctaArrow}>→</span>
          </button>

          {items.length === 0 && (
            <button onClick={handleFinish} className={styles.skipLink} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              I&apos;ll do this later
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
