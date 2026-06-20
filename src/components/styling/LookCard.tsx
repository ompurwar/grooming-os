import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Shirt, Camera, ShoppingCart, Trash2, X, Sparkles, Check, RefreshCw, Bookmark } from 'lucide-react'
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
  const [justSaved, setJustSaved] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // If at least 30% of the card is visible, switch to image mode automatically
          if (entry.isIntersecting) {
            setShowImages(true)
          }
        })
      },
      { threshold: 0.3 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const isHeroMode = !!tryOnImageUrl

  const handleSave = () => {
    if (onSave) {
      onSave()
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 1500)
    }
  }

  return (
    <div className={styles.lookCard} ref={cardRef}>
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
          <div className={styles.subtitleRow}>
            <span className={styles.subtitle}>AI Curated Look</span>
            {capsuleInfo && (
              <span className={styles.capsuleBadge}>
                🌍 {capsuleInfo.title}
              </span>
            )}
          </div>
        </div>
        {!isHeroMode && (
          <div className={styles.headerBadges}>
            <div 
              className={styles.toggleContainer} 
              title="Switch between icons and photos"
              onClick={() => setShowImages(!showImages)}
              style={{ cursor: 'pointer' }}
            >
              <span className={styles.toggleIcon}><Shirt size={14} /></span>
              <label className={styles.switch} onClick={(e) => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  checked={showImages} 
                  onChange={(e) => setShowImages(e.target.checked)} 
                />
                <span className={styles.slider}></span>
              </label>
              <span className={styles.toggleIcon}><Camera size={14} /></span>
              <span className={styles.toggleLabel}>{showImages ? 'Photos' : 'Icons'}</span>
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
            <div 
              className={styles.toggleContainer} 
              style={{ alignSelf: 'flex-end', marginBottom: '16px', cursor: 'pointer' }}
              onClick={() => setShowImages(!showImages)}
            >
              <span className={styles.toggleIcon}><Shirt size={14} /></span>
              <label className={styles.switch} onClick={(e) => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  checked={showImages} 
                  onChange={(e) => setShowImages(e.target.checked)} 
                />
                <span className={styles.slider}></span>
              </label>
              <span className={styles.toggleIcon}><Camera size={14} /></span>
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
                    return typeof Icon === 'string' ? Icon : <Icon size={26} />
                  })()
                )}
              </div>
              <div className={styles.itemDetails}>
                <div className={styles.itemType}>{item.type}</div>
                <div className={styles.itemName}>{item.name}</div>
                {/* Only show source if it's meaningful (not just "From Wardrobe") */}
                {(item.price || item.source !== 'From Wardrobe') && (
                  <div className={styles.itemSource}>
                    {item.source !== 'From Wardrobe' && item.source}
                    {item.price && <span className={styles.price}>{item.source !== 'From Wardrobe' ? ' — ' : ''}{item.price}</span>}
                  </div>
                )}
              </div>
              {item.isUpgrade && <div className={styles.cartIcon}><ShoppingCart size={16} /></div>}
            </div>
          ))}
        </div>
      )}

      {(onGenerateTryOn || onDelete || onTryAlternatives || onSave) && (
        <div className={styles.actions}>
          {/* Try On Outfit CTA — prominent styled button */}
          {!isHeroMode && onGenerateTryOn && (
            <button 
              className={styles.btnTryOn}
              onClick={onGenerateTryOn}
              disabled={isGeneratingTryOn}
            >
              <Sparkles size={18} />
              {isGeneratingTryOn ? 'Generating...' : 'Try On Outfit'}
            </button>
          )}
          
          <div className={styles.actionRow}>
            {/* Delete — small, de-emphasized */}
            {onDelete && (
              <button 
                className={styles.btnDelete}
                onClick={onDelete}
                title="Delete Look"
              >
                <Trash2 size={18} />
              </button>
            )}
            {/* Alternatives — only when handler provided */}
            {onTryAlternatives && (
              <button className={styles.btnSecondary} onClick={onTryAlternatives}>
                <RefreshCw size={15} />
                Alternatives
              </button>
            )}
            {/* Save — only when handler provided */}
            {onSave && (
              <button 
                className={`${styles.btnSave} ${isSaved || justSaved ? styles.btnSaved : ''}`}
                onClick={handleSave}
                disabled={isSaved}
              >
                {isSaved ? (
                  <>
                    <Check size={16} />
                    Saved
                  </>
                ) : justSaved ? (
                  <>
                    <Check size={16} className={styles.checkAnim} />
                    Saved!
                  </>
                ) : (
                  <>
                    <Bookmark size={16} />
                    Save
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

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
