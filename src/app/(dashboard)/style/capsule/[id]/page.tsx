import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import styles from './page.module.css'

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
        <h1>{capsule.title}</h1>
        <div className={styles.meta}>
          <span>🌍 {capsule.destinations}</span>
          <span>📅 {capsule.days} Days</span>
          <span>🎒 {capsule.bag_size}</span>
        </div>
      </header>

      <section className={styles.reasoningSection}>
        <h3>AI Packing Strategy</h3>
        <p>{capsule.reasoning}</p>
      </section>

      <section className={styles.packingList}>
        <h3>Your Packing List ({capsuleItems.length} Items)</h3>
        
        {Object.entries(categorizedItems).map(([category, items]: [string, any]) => (
          <div key={category} className={styles.categoryGroup}>
            <h4 className={styles.categoryTitle}>{category} <span className={styles.countBadge}>{items.length}</span></h4>
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
        ))}
      </section>
    </div>
  )
}
