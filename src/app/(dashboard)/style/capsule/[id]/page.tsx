import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Calendar, Backpack, CheckCircle, Shirt, Footprints, Watch, Scissors, ShoppingCart } from 'lucide-react'
import styles from './page.module.css'

const CATEGORY_ICONS: Record<string, any> = {
  Top: Shirt,
  Bottom: Shirt,
  Footwear: Footprints,
  Accessory: Watch,
  Hairstyle: Scissors,
  Other: ShoppingCart,
}

export default async function CapsulePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  
  // Use admin client in Server Component to bypass any RLS SSR cookie issues
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Fetch Capsule
  const { data: capsule, error: capsuleError } = await supabaseAdmin
    .from('capsules')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (capsuleError || !capsule) {
    notFound()
  }

  // 2. Fetch Capsule Items joined with Wardrobe Items
  const { data: capsuleItems, error: itemsError } = await supabaseAdmin
    .from('capsule_items')
    .select(`
      is_core_item,
      item_reasoning,
      wardrobe_items (
        id,
        image_url,
        category,
        sub_category,
        primary_color,
        pattern,
        material
      )
    `)
    .eq('capsule_id', resolvedParams.id)

  if (itemsError || !capsuleItems) {
    return <div>Failed to load capsule items.</div>
  }

  // Group items by category for the packing list view
  const categorizedItems = capsuleItems.reduce((acc: any, ci: any) => {
    const item = ci.wardrobe_items
    if (!item) return acc
    const cat = item.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push({ ...item, is_core: ci.is_core_item })
    return acc
  }, {})

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/style" className={styles.backBtn}>← Back</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1>{capsule.title}</h1>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: 'var(--color-success)', background: 'var(--color-success-bg)', padding: '4px 10px', borderRadius: '16px' }}>
            <CheckCircle size={14} /> Saved
          </span>
        </div>
        <div className={styles.meta} style={{ display: 'flex', gap: '16px', marginTop: '12px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> {capsule.destinations}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> {capsule.days} Days</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Backpack size={16} /> {capsule.bag_size}L Limit</span>
        </div>
      </header>

      <section className={styles.reasoningSection}>
        <h3>AI Packing Strategy</h3>
        <p>{capsule.reasoning}</p>
      </section>

      <section className={styles.packingList}>
        <h3>Your Packing List ({capsuleItems.length} Items)</h3>
        
        {Object.entries(categorizedItems).map(([category, items]: [string, any]) => {
          const Icon = CATEGORY_ICONS[category] || CATEGORY_ICONS.Other
          return (
            <div key={category} className={styles.categoryGroup}>
              <h4 className={styles.categoryTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon size={18} /> {category} <span className={styles.countBadge}>{items.length}</span>
              </h4>
              <div className={styles.itemGrid}>
                {items.map((item: any) => (
                  <Link key={item.id} href={`/wardrobe/${item.id}`} className={styles.itemCard}>
                    <div className={styles.imageWrapper}>
                      <Image 
                        src={item.image_url} 
                        alt={item.sub_category || category}
                        fill
                        className={styles.image}
                        sizes="(max-width: 768px) 33vw, 20vw"
                      />
                      {item.is_core && <div className={styles.coreBadge}>Core Base</div>}
                    </div>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{item.primary_color} {item.sub_category}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
