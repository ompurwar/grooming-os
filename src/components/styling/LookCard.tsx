import { useState } from 'react'
import Image from 'next/image'
import styles from './LookCard.module.css'

export interface LookCardProps {
  occasion: string;
  confidence: number;
  items: {
    type: 'Hairstyle' | 'Top' | 'Bottom' | 'Footwear' | 'Accessory' | 'Upgrade' | string;
    icon: string;
    name: string;
    source: string;
    isUpgrade?: boolean;
    price?: string;
    imageUrl?: string;
  }[];
  reasoning: string;
  onSave?: () => void;
  onTryAlternatives?: () => void;
  isSaved?: boolean;
}

export default function LookCard({ occasion, confidence, items, reasoning, onSave, onTryAlternatives, isSaved }: LookCardProps) {
  const [showImages, setShowImages] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)

  return (
    <div className={styles.lookCard}>
      <div className={styles.glow} />
      
      <div className={styles.header}>
        <div className={styles.headerTitleArea}>
          <h2 className={styles.occasion}>{occasion}</h2>
          <span className={styles.subtitle}>AI Curated Look</span>
        </div>
        <div className={styles.headerBadges}>
          <div className={styles.toggleContainer}>
            <span className={styles.toggleIcon}>👔</span>
            <label className={styles.switch}>
              <input 
                type="checkbox" 
                checked={showImages} 
                onChange={() => setShowImages(!showImages)} 
              />
              <span className={styles.slider}></span>
            </label>
            <span className={styles.toggleIcon}>📸</span>
          </div>
          <div className={styles.confidenceBadge}>
            {confidence}% Match ✨
          </div>
        </div>
      </div>

      <div className={styles.itemsList}>
        {items.map((item, index) => (
          <div 
            key={index} 
            className={`${styles.item} ${item.isUpgrade ? styles.itemUpgrade : ''}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={styles.itemIcon}>
              {showImages && item.imageUrl ? (
                <div 
                  className={styles.imageWrapper} 
                  onClick={() => setFullscreenImage(item.imageUrl || null)}
                  style={{ cursor: 'pointer' }}
                >
                  <Image src={item.imageUrl} alt={item.name} fill style={{ objectFit: 'cover' }} unoptimized={true} />
                </div>
              ) : (
                item.icon
              )}
            </div>
            <div className={styles.itemDetails}>
              <div className={styles.itemType}>{item.type}</div>
              <div className={styles.itemName}>{item.name}</div>
              <div className={styles.itemSource}>
                {item.source}
                {item.price && <span className={styles.price}> — {item.price}</span>}
              </div>
            </div>
            {item.isUpgrade && <div className={styles.cartIcon}>🛒</div>}
          </div>
        ))}
      </div>

      <div className={styles.reasoningSection}>
        <h3 className={styles.reasoningTitle}>Why This Works</h3>
        <p className={styles.reasoningText}>{reasoning}</p>
      </div>

      <div className={styles.actions}>
        <button className={styles.btnSecondary} onClick={onTryAlternatives}>Try Alternatives</button>
        <button 
          className={styles.btnPrimary} 
          onClick={onSave}
          disabled={isSaved}
        >
          {isSaved ? 'Saved ✓' : 'Save Look'}
        </button>
      </div>

      {fullscreenImage && (
        <div className={styles.fullscreenOverlay} onClick={() => setFullscreenImage(null)}>
          <div className={styles.fullscreenClose}>✕</div>
          <div className={styles.fullscreenImageContainer}>
            <Image 
              src={fullscreenImage} 
              alt="Fullscreen Preview" 
              fill 
              style={{ objectFit: 'contain' }} 
              unoptimized={true} 
            />
          </div>
        </div>
      )}
    </div>
  )
}
