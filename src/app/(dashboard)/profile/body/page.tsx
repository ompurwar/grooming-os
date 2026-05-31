import Link from 'next/link'
import styles from './page.module.css'

export default function BodyAnalysisPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/profile" className={styles.backBtn}>←</Link>
        <h1 className={styles.title}>Body Analysis</h1>
      </header>

      <div className={styles.visualContainer}>
        <div className={styles.bodyIcon}>🧍</div>
        <div className={styles.bodyType}>Inverted Triangle</div>
        <p style={{ color: 'var(--color-gray-400)', marginTop: '8px', fontSize: '14px' }}>
          Broad shoulders that taper down to a narrow waist.
        </p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Measurements & Proportions</h2>
        <div className={styles.metricGrid}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Shoulder Width</span>
            <span className={styles.metricValue}>Broad</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Torso Ratio</span>
            <span className={styles.metricValue}>Average</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Build</span>
            <span className={styles.metricValue}>Athletic</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Leg Ratio</span>
            <span className={styles.metricValue}>Long</span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Fit Recommendations</h2>
        <div className={styles.adviceList}>
          <div className={styles.adviceItem}>
            <span className={styles.adviceIcon}>✓</span>
            <span className={styles.adviceText}><strong>V-neck shirts</strong> draw the eye downward and complement your chest structure.</span>
          </div>
          <div className={styles.adviceItem}>
            <span className={styles.adviceIcon}>✓</span>
            <span className={styles.adviceText}><strong>Straight-leg trousers</strong> help balance your broad shoulders and add proportion to your lower half.</span>
          </div>
          <div className={styles.adviceItem}>
            <span className={styles.adviceIcon}>✗</span>
            <span className={styles.adviceText}>Avoid <strong>structured shoulder pads</strong> in jackets, as they will make you look disproportionately wide on top.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
