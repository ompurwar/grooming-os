import Link from 'next/link'
import styles from './page.module.css'

export default function PlansPage() {
  return (
    <div className={styles.page}>
      {/* Background gradient orbs */}
      <div className={styles.bgOrbs} aria-hidden="true">
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>

      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Choose Your Plan</h1>
          <p className={styles.subtitle}>Select the perfect tier to start your styling journey.</p>
        </header>

        <div className={styles.pricingGrid}>
          <div className={styles.pricingCard}>
            <h3>Free</h3>
            <div className={styles.price}>₹0<span>/mo</span></div>
            <ul className={styles.pricingFeatures}>
              <li>✓ 5 AI outfits per month</li>
              <li>✓ Basic wardrobe digitization</li>
              <li>✓ Body type analysis</li>
            </ul>
            <Link href="/onboarding" className={styles.pricingBtnGhost}>Get Started</Link>
          </div>
          
          <div className={`${styles.pricingCard} ${styles.pricingCardPro}`}>
            <div className={styles.popularBadge}>Most Popular</div>
            <h3>Pro</h3>
            <div className={styles.price}>₹999<span>/mo</span></div>
            <ul className={styles.pricingFeatures}>
              <li>✓ Unlimited AI outfits</li>
              <li>✓ Unlimited wardrobe items</li>
              <li>✓ Full grooming visualizations</li>
              <li>✓ Smart marketplace access</li>
            </ul>
            <Link href="/onboarding" className={styles.pricingBtn}>Upgrade to Pro</Link>
          </div>

          <div className={styles.pricingCard}>
            <h3>Elite</h3>
            <div className={styles.price}>₹2,499<span>/mo</span></div>
            <ul className={styles.pricingFeatures}>
              <li>✓ Everything in Pro</li>
              <li>✓ Personal style concierge</li>
              <li>✓ Priority AI generation</li>
              <li>✓ Early access to new features</li>
            </ul>
            <Link href="/onboarding" className={styles.pricingBtnGhost}>Get Elite</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
