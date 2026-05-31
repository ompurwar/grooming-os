import Link from 'next/link'
import styles from './page.module.css'

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  // Mock data for MVP
  const item = {
    id: params.id,
    name: 'Navy Linen Shirt',
    category: 'Top',
    color: 'Navy',
    material: 'Linen',
    pattern: 'Solid',
    formality: 3,
    timesWorn: 12,
    addedAt: '2023-10-15',
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
        {/* Placeholder for item image */}
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
                <span key={i} style={{ color: i < item.formality ? 'var(--color-gold)' : 'rgba(255,255,255,0.2)' }}>★</span>
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
