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
  onDelete?: () => void;
  onGenerateTryOn?: () => void;
  isSaved?: boolean;
  savedAsLabel?: string;
  tryOnImageUrl?: string | null;
  isGeneratingTryOn?: boolean;
}

export default function LookCard({ 
  occasion, 
  confidence, 
  items, 
  reasoning, 
  onSave, 
  onTryAlternatives, 
  onDelete,
  onGenerateTryOn,
  isSaved, 
  savedAsLabel,
  tryOnImageUrl,
  isGeneratingTryOn
}: LookCardProps) {
  const [showImages, setShowImages] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const [showItemsAccordion, setShowItemsAccordion] = useState(false)

  const isHeroMode = !!tryOnImageUrl

  return (
    <div className={styles.lookCard}>
      <div className={styles.glow} />
      
      {/* Hero Try-On Image */}
      {isHeroMode && (
        <div className={styles.heroImageContainer} onClick={() => setFullscreenImage(tryOnImageUrl!)}>
          <Image 
            src={tryOnImageUrl!} 
            alt="Virtual Try-On" 
            fill 
            style={{ objectFit: 'cover' }} 
            unoptimized={true} 
          />
          <div className={styles.heroOverlay}>
            <div className={styles.confidenceBadge} style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}>
              {confidence}% Match ✨
            </div>
          </div>
        </div>
      )}

      <div className={styles.header} style={isHeroMode ? { paddingTop: '24px' } : undefined}>
        <div className={styles.headerTitleArea}>
          <h2 className={styles.occasion}>{occasion}</h2>
          <span className={styles.subtitle}>AI Curated Look</span>
        </div>
        {!isHeroMode && (
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
        )}
      </div>

      <div className={styles.reasoningSection} style={isHeroMode ? { marginTop: 0 } : undefined}>
        <h3 className={styles.reasoningTitle}>Why This Works</h3>
        <p className={styles.reasoningText}>{reasoning}</p>
      </div>

      {isHeroMode && (
        <button 
          className={styles.accordionToggle} 
          onClick={() => setShowItemsAccordion(!showItemsAccordion)}
        >
          {showItemsAccordion ? 'Hide Items 👆' : 'Show Items 👇'}
        </button>
      )}

      {(!isHeroMode || showItemsAccordion) && (
        <div className={styles.itemsList}>
          {isHeroMode && (
            <div className={styles.toggleContainer} style={{ alignSelf: 'flex-end', marginBottom: '16px' }}>
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
          )}
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
      )}

      <div className={styles.actions}>
        {!isHeroMode && onGenerateTryOn && (
          <button 
            className={styles.btnSecondary} 
            style={{ width: '100%', marginBottom: '12px', background: 'var(--color-primary)', color: '#fff', border: 'none' }}
            onClick={onGenerateTryOn}
            disabled={isGeneratingTryOn}
          >
            {isGeneratingTryOn ? 'Generating...' : 'Try On Outfit ✨'}
          </button>
        )}
        
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          {onDelete && (
            <button 
              className={styles.btnSecondary} 
              style={{ padding: '0 16px', background: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', flexShrink: 0 }}
              onClick={onDelete}
              title="Delete Look"
            >
              🗑️
            </button>
          )}
          <button className={styles.btnSecondary} style={{ flex: 1 }} onClick={onTryAlternatives}>Alternatives</button>
          <button 
            className={styles.btnPrimary} 
            style={{ flex: 1 }}
            onClick={onSave}
            disabled={isSaved}
          >
            {isSaved ? (savedAsLabel ? `Saved as '${savedAsLabel}' ✓` : 'Saved ✓') : 'Save'}
          </button>
        </div>
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
