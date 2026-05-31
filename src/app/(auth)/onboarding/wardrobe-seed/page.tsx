'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

type CapturingState = 'idle' | 'capturing' | 'tagging'

export default function WardrobeSeedPage() {
  const router = useRouter()
  const [items, setItems] = useState<{ id: number; url: string; category: string }[]>([])
  const [state, setState] = useState<CapturingState>('idle')
  const [mockId, setMockId] = useState(1)

  const handleCapture = () => {
    setState('capturing')
    // Simulate AI capturing and tagging an item
    setTimeout(() => {
      setState('tagging')
      setTimeout(() => {
        const categories = ['Top', 'Bottom', 'Outerwear', 'Footwear']
        const randomCategory = categories[Math.floor(Math.random() * categories.length)]
        
        setItems(prev => [...prev, {
          id: mockId,
          url: `https://via.placeholder.com/150/1e1e24/a1a1aa?text=${randomCategory}`,
          category: randomCategory,
        }])
        setMockId(prev => prev + 1)
        setState('idle')
      }, 1500)
    }, 1000)
  }

  const handleFinish = () => {
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
            <button className={styles.captureButton} onClick={handleCapture}>
              <div className={styles.cameraIcon}>📸</div>
              <span>Tap to photograph an item</span>
              <p className={styles.captureHelp}>Lay flat or hang against a plain background</p>
            </button>
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
            <Link href="/home" className={styles.skipLink}>
              I&apos;ll do this later
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
