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
    itemReasoning?: string;
  }[];
  reasoning: string;
  onSave?: () => void;
  onTryAlternatives?: () => void;
  onDelete?: () => void;
  onGenerateTryOn?: () => void;
  isSaved?: boolean;
  savedAsLabel?: string;
  tryOnImageUrl?: string | null;
  isGeneratingTryOn?: boolean | string;
  capsuleInfo?: { id: string, title: string };
}

function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (scale > 1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      setScale(2.5)
      setPosition({ x: 0, y: 0 })
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale === 1) return
    e.stopPropagation()
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale === 1) return
    e.stopPropagation()
    e.preventDefault()
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale === 1) return
    e.stopPropagation()
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || scale === 1) return
    e.stopPropagation()
    const touch = e.touches[0]
    setPosition({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y })
  }

  return (
    <div 
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      style={{
        cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: scale > 1 ? 'visible' : 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}
    >
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          width: '100%',
          height: '100%',
          position: 'relative'
        }}
      >
        <Image 
          src={src} 
          alt={alt} 
          fill 
          style={{ objectFit: 'contain', pointerEvents: 'none' }} 
          unoptimized={true} 
        />
      </div>
      {scale > 1 && (
        <div 
          style={{
            position: 'absolute',
            bottom: '16px',
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            pointerEvents: 'none',
            zIndex: 10,
            letterSpacing: '0.2px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          Drag to pan • Double-tap to zoom out
        </div>
      )}
    </div>
  )
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

  const isHeroMode = !!tryOnImageUrl || !!isGeneratingTryOn

  const handleSave = () => {
    if (onSave) {
      onSave()
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 1500)
      
      const { analytics } = require('@/utils/analytics')
      analytics.track('LOOK_SAVED', {
        occasion: occasion,
        confidence: confidence.toString()
      })
    }
  }

  return (
    <div className={styles.lookCard} ref={cardRef}>
      <div className={styles.glow} />
      
      {/* Hero Try-On Image */}
      {isHeroMode && (
        <div key={tryOnImageUrl || 'generating'} className={`${styles.heroImageContainer} ${styles.fadeIn}`} onClick={() => tryOnImageUrl && setFullscreenImage(tryOnImageUrl)}>
          {tryOnImageUrl ? (
            <Image 
              src={tryOnImageUrl!} 
              alt="Virtual Try-On" 
              fill 
              style={{ objectFit: 'cover' }} 
              unoptimized={true} 
            />
          ) : (
            <div className={styles.magicalShimmerContainer}>
              <div className={styles.magicalShimmer} />
              <div className={styles.sparklesOverlay}>
                <Sparkles className={`${styles.sparkleIcon} ${styles.sparkle1}`} size={32} />
                <Sparkles className={`${styles.sparkleIcon} ${styles.sparkle2}`} size={16} />
                <Sparkles className={`${styles.sparkleIcon} ${styles.sparkle3}`} size={24} />
              </div>
              <div className={styles.loadingTextContainer}>
                <RefreshCw size={24} className="spin" style={{ color: 'var(--color-accent)' }} />
                <span>{typeof isGeneratingTryOn === 'string' ? isGeneratingTryOn : 'Generating Virtual Try-On...'}</span>
                <p>Applying the clothes to your body photo</p>
              </div>
            </div>
          )}
          {tryOnImageUrl && (
            <div className={styles.heroOverlay}>
              <div className={styles.confidenceBadge} style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}>
                {confidence}% Match ✨
              </div>
            </div>
          )}
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
                {item.itemReasoning && (
                  <div className={styles.itemSource} style={{ fontStyle: 'italic', fontSize: '11px', lineHeight: '1.3', marginTop: '2px', opacity: 0.7 }}>
                    {item.itemReasoning}
                  </div>
                )}
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
          {!isHeroMode && onGenerateTryOn && (
            <button 
              className={styles.btnTryOn}
              onClick={onGenerateTryOn}
              disabled={!!isGeneratingTryOn}
            >
              <Sparkles size={18} />
              {typeof isGeneratingTryOn === 'string' ? isGeneratingTryOn : isGeneratingTryOn ? 'Generating...' : 'Try On Outfit'}
            </button>
          )}
          
          <div className={styles.actionRow}>
            {onDelete && (
              <button 
                className={styles.btnDelete}
                onClick={onDelete}
                title="Delete Look"
              >
                <Trash2 size={18} />
              </button>
            )}
            {onTryAlternatives && (
              <button className={styles.btnSecondary} onClick={onTryAlternatives}>
                <RefreshCw size={15} />
                Alternatives
              </button>
            )}
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
          <div className={styles.fullscreenImageContainer} onClick={(e) => e.stopPropagation()}>
            <ZoomableImage 
              src={fullscreenImage} 
              alt="Fullscreen Preview" 
            />
          </div>
        </div>
      )}
    </div>
  )
}
