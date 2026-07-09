'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Check, Sparkles, Info } from 'lucide-react'
import { useLongPress } from '@/hooks/useLongPress'
import styles from './page.module.css'

const FILTERS = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Footwear', 'Accessories', 'Jewelry', 'Ethnic']

interface WardrobeItem {
  id: string
  category: string
  sub_category?: string
  primary_color: string
  formality_score: number
  image_url: string
}

function WardrobeContent() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState('All')
  const [items, setItems] = useState<WardrobeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Selection state
  const searchParams = useSearchParams()
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])

  useEffect(() => {
    if (searchParams.get('select') === 'true') {
      setIsSelectionMode(true)
    }
  }, [searchParams])

  useEffect(() => {
    async function fetchItems() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .order('added_at', { ascending: false })

      if (data) {
        setItems(data)
      }
      setIsLoading(false)
    }

    fetchItems()
  }, [])

  const filteredItems = items.filter(item => {
    if (activeFilter === 'All') return true
    
    const itemCat = item.category.toLowerCase()
    const filterCat = activeFilter.toLowerCase()
    
    // Explicit mapping for pluralization edge cases
    const pluralMap: Record<string, string> = {
      'accessory': 'accessories',
      'dress': 'dresses',
      'jewelry': 'jewelry',
      'footwear': 'footwear',
      'ethnic': 'ethnic',
      'outerwear': 'outerwear'
    }
    
    const itemPlural = pluralMap[itemCat] || `${itemCat}s`
    
    return itemCat === filterCat || itemPlural === filterCat || itemCat === pluralMap[filterCat]
  })

  const handleToggleSelect = (id: string) => {
    setSelectedItemIds(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(i => i !== id)
        if (next.length === 0) setIsSelectionMode(false)
        return next
      }
      return [...prev, id]
    })
  }

  const handleLongPress = (id: string) => {
    // Selection mode now ONLY activates via the Create Look button.
    // Long press does nothing if not in selection mode.
    if (isSelectionMode) {
      handleToggleSelect(id)
    }
  }

  const handleCreateLook = () => {
    if (selectedItemIds.length > 0) {
      const returnTo = searchParams.get('returnTo') || 'style'
      router.push(`/${returnTo}?items=${selectedItemIds.join(',')}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this item? Past looks using it will be preserved.')) return;
    
    // Optimistic UI update
    setItems(items.filter(item => item.id !== id))
    
    const supabase = createClient()
    await supabase
      .from('wardrobe_items')
      .update({ is_active: false, retired_at: new Date().toISOString() })
      .eq('id', id)
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>My Wardrobe</h1>
          <span className={styles.itemCount}>{items.length} items</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isSelectionMode && (
            <button 
              onClick={() => setIsSelectionMode(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-glass-border)',
                borderRadius: 'var(--radius-full)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--text-sm)',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={14} /> Create Look
            </button>
          )}
          {isSelectionMode && (
            <button 
              onClick={() => {
                setIsSelectionMode(false)
                setSelectedItemIds([])
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'transparent',
                border: '1px solid transparent',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--text-sm)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          )}
          <Link href="/wardrobe/add" className={styles.addButton}>
            +
          </Link>
        </div>
      </header>

      {/* Filters */}
      <div className={styles.filtersScroll}>
        {FILTERS.map(filter => (
          <button
            key={filter}
            className={`${styles.filterPill} ${activeFilter === filter ? styles.filterPillActive : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
      
      <div className={styles.sortBar}>
        <span className={styles.sortLabel}>Sort by:</span>
        <select className={styles.sortSelect}>
          <option>Recent</option>
          <option>Category</option>
          <option>Color</option>
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className={styles.emptyState}>
          <p>Loading your wardrobe...</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className={styles.grid}>
          {filteredItems.map(item => (
            <WardrobeItemCard 
              key={item.id}
              item={item}
              isSelectionMode={isSelectionMode}
              isSelected={selectedItemIds.includes(item.id)}
              onToggleSelect={handleToggleSelect}
              onLongPressItem={handleLongPress}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👔</div>
          <h2>Your Virtual Wardrobe is Empty</h2>
          <p style={{ maxWidth: '400px', margin: '8px auto 24px', lineHeight: '1.5' }}>
            Digitize your closet to unlock the power of AI styling. Add your favorite clothes, shoes, and accessories so your Personal Stylist can start building your daily looks and travel capsules!
          </p>
          <Link href="/wardrobe/add" className={styles.emptyButton}>Add Your First Item</Link>
        </div>
      )}

      {/* Floating Action Button for Create Look */}
      {isSelectionMode && selectedItemIds.length > 0 && (
        <button className={styles.fab} onClick={handleCreateLook}>
          <Sparkles size={20} />
          Create Look with {selectedItemIds.length} {selectedItemIds.length === 1 ? 'Item' : 'Items'}
        </button>
      )}
    </div>
  )
}

function WardrobeItemCard({ item, isSelectionMode, isSelected, onToggleSelect, onLongPressItem, onDelete }: any) {
  const router = useRouter()
  
  const longPress = useLongPress(
    (e) => {
      // Long press triggers selection mode
      e.preventDefault()
      onLongPressItem(item.id)
    },
    (e) => {
      // Regular click on the card body does nothing now per user request.
      // Interactions are restricted to the info button and checkbox.
    },
    { delay: 500 }
  )

  return (
    <div 
      {...longPress}
      className={`${styles.itemCard} ${isSelected ? styles.selectedCard : ''}`} 
      style={{ cursor: 'pointer', position: 'relative', userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Selection Indicator */}
      {isSelectionMode && (
        <div 
          className={`${styles.selectionIndicator} ${isSelected ? styles.checked : ''}`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleSelect(item.id)
          }}
          style={{ cursor: 'pointer', zIndex: 10 }}
        >
          {isSelected && <Check strokeWidth={3} />}
        </div>
      )}

      <div className={styles.itemImage}>
        {!isSelectionMode && (
          <button
            className={styles.infoBtn}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              router.push(`/wardrobe/${item.id}`)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchEnd={(e) => {
              e.preventDefault()
              e.stopPropagation()
              router.push(`/wardrobe/${item.id}`)
            }}
            title="View Details"
          >
            <Info size={16} />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image_url} alt="Wardrobe Item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div className={styles.itemInfo}>
        <div className={styles.itemHeader}>
          <h3 className={styles.itemName}>{item.primary_color} {item.sub_category || item.category}</h3>
          {!isSelectionMode && (
            <button 
              className={styles.deleteBtn} 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete(item.id)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchEnd={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete(item.id)
              }}
              title="Remove item"
            >
              🗑️
            </button>
          )}
        </div>
        <span className={styles.itemType}>{item.category}</span>
        <div className={styles.formalityStars}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < (item.formality_score || 3) ? styles.starFilled : styles.starEmpty}>★</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function WardrobePage() {
  return (
    <Suspense fallback={<div className={styles.container}><div className={styles.loadingState}><div className={styles.spinner} /></div></div>}>
      <WardrobeContent />
    </Suspense>
  )
}
