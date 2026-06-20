import Link from 'next/link'
import styles from './page.module.css'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    redirect('/login')
  }

  const { data: itemData, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single()

  if (error || !itemData) {
    redirect('/wardrobe')
  }

  const item = {
    id: itemData.id,
    name: `${itemData.primary_color} ${itemData.sub_category || itemData.category}`,
    category: itemData.category,
    color: itemData.primary_color,
    material: 'Unknown', // Future feature
    pattern: 'Unknown', // Future feature
    formality: itemData.formality_score || 3,
    timesWorn: 0, // Future feature
    addedAt: new Date(itemData.created_at).toLocaleDateString(),
    imageUrl: itemData.image_url
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/wardrobe" className={styles.backBtn}>← Back</Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={styles.editBtn}>Edit</button>
          <button className={styles.deleteBtn}>Delete</button>
        </div>
      </header>

      <div className={styles.imageContainer}>
        {item.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No Image
          </div>
        )}
      </div>

      <div className={styles.infoCard}>
        <h1 className={styles.itemTitle}>{item.name}</h1>
        
        <div className={styles.badgeRow}>
          <span className={styles.badge}>{item.category}</span>
          <span className={styles.badge}>{item.color}</span>
          <span className={styles.badge}>{item.material}</span>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Pattern</span>
            <span className={styles.statValue}>{item.pattern}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Formality</span>
            <span className={styles.statValue}>
              {Array(5).fill(0).map((_, i) => (
                <span key={i} style={{ color: i < item.formality ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)' }}>★</span>
              ))}
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Added</span>
            <span className={styles.statValue}>{item.addedAt}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Times Worn</span>
            <span className={styles.statValue}>{item.timesWorn}</span>
          </div>
        </div>
      </div>

      <div className={styles.outfitHistory}>
        <h2 className={styles.historyTitle}>Recent Outfits</h2>
        <div className={styles.emptyHistory}>
          You haven&apos;t worn this item in a saved outfit yet.
        </div>
      </div>
    </div>
  )
}
