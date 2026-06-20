'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import styles from './page.module.css'

const FILTERS = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Footwear', 'Accessories', 'Ethnic']

interface WardrobeItem {
  id: string
  category: string
  sub_category?: string
  primary_color: string
  formality_score: number
  image_url: string
}

export default function WardrobePage() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [items, setItems] = useState<WardrobeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  const filteredItems = activeFilter === 'All' 
    ? items 
    : items.filter(item => 
        item.category === activeFilter || 
        item.category === activeFilter.slice(0, -1) || 
        (activeFilter === 'Accessories' && item.category === 'Accessory')
      )

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
        <Link href="/wardrobe/add" className={styles.addButton}>
          +
        </Link>
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
            <Link href={`/wardrobe/${item.id}`} key={item.id} className={styles.itemCard} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className={styles.itemImage}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image_url} alt="Wardrobe Item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className={styles.itemInfo}>
                <div className={styles.itemHeader}>
                  <h3 className={styles.itemName}>{item.primary_color} {item.sub_category || item.category}</h3>
                  <button 
                    className={styles.deleteBtn} 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDelete(item.id)
                    }}
                    title="Remove item"
                  >
                    🗑️
                  </button>
                </div>
                <span className={styles.itemType}>{item.category}</span>
                <div className={styles.formalityStars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < (item.formality_score || 3) ? styles.starFilled : styles.starEmpty}>★</span>
                  ))}
                </div>
              </div>
            </Link>
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
    </div>
  )
}
