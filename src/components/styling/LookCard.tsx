import { useState } from 'react'
import Image from 'next/image'
import { Shirt, Camera, ShoppingCart, Trash2, X } from 'lucide-react'
import styles from './LookCard.module.css'

export interface LookCardProps {
  occasion: string;
  confidence: number;
  items: {
    type: 'Hairstyle' | 'Top' | 'Bottom' | 'Footwear' | 'Accessory' | 'Upgrade' | string;
    icon: any;
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
  capsuleInfo?: { id: string, title: string };
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
  isGeneratingTryOn,
  capsuleInfo
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className={styles.subtitle}>AI Curated Look</span>
            {capsuleInfo && (
              <span style={{ fontSize: '12px', padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                🌍 From Capsule: {capsuleInfo.title}
              </span>
            )}
          </div>
        </div>
        {!isHeroMode && (
          <div className={styles.headerBadges}>
            <div className={styles.toggleContainer}>
              <span className={styles.toggleIcon}><Shirt size={16} /></span>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={showImages} 
                  onChange={() => setShowImages(!showImages)} 
                />
                <span className={styles.slider}></span>
              </label>
              <span className={styles.toggleIcon}><Camera size={16} /></span>
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
              <span className={styles.toggleIcon}><Shirt size={16} /></span>
              <label className={styles.switch}>
                <input 
                  type="checkbox" 
                  checked={showImages} 
                  onChange={() => setShowImages(!showImages)} 
                />
                <span className={styles.slider}></span>
              </label>
              <span className={styles.toggleIcon}><Camera size={16} /></span>
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
                  (() => {
                    const Icon = item.icon
                    return typeof Icon === 'string' ? Icon : <Icon size={24} />
                  })()
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
              {item.isUpgrade && <div className={styles.cartIcon}><ShoppingCart size={16} /></div>}
            </div>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        {!isHeroMode && onGenerateTryOn && (
          <button 
            className={styles.btnSecondary} 
            style={{ width: '100%', marginBottom: '12px', background: 'var(--color-accent)', color: 'var(--color-text-inverse)', border: 'none' }}
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
              style={{ padding: '0 16px', background: 'transparent', color: 'var(--color-error)', border: '1px solid var(--color-error)', flexShrink: 0 }}
              onClick={onDelete}
              title="Delete Look"
            >
              <Trash2 size={20} />
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
          <div className={styles.fullscreenClose}><X size={24} /></div>
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
