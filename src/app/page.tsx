import Link from 'next/link'
import styles from './page.module.css'

export default function LandingPage() {
  return (
    <div className={styles.container}>
      {/* Decorative Orbs */}
      <div className={styles.heroOrb1} />
      <div className={styles.heroOrb2} />

      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <span className="gradient-text">GROOMING</span> OS
        </div>
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#how-it-works" className={styles.navLink}>How It Works</a>
          <a href="#pricing" className={styles.navLink}>Pricing</a>
        </div>
        <Link href="/login" className={styles.loginBtn}>Log In</Link>
        <Link href="/onboarding" className={styles.navCta}>Get Started</Link>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          ✨ The Future of Personal Styling
        </div>
        <h1 className={styles.heroTitle}>
          Your AI Stylist That Knows <span className="gradient-text">You</span>
        </h1>
        <p className={styles.heroSubtitle}>
          From head to toe, your entire appearance — orchestrated by AI. We digitize your wardrobe, analyze your body, and style you for any occasion in seconds.
        </p>
        
        <div className={styles.heroCtas}>
          <Link href="/onboarding" className={styles.primaryCta}>
            Start Your Transformation
          </Link>
          <a href="#how-it-works" className={styles.secondaryCta}>
            See How It Works
          </a>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statBadge}>
            <span className={styles.statIcon}>👔</span> 10K+ Wardrobes Digitized
          </div>
          <div className={styles.statBadge}>
            <span className={styles.statIcon}>✨</span> 98% Style Match Rate
          </div>
          <div className={styles.statBadge}>
            <span className={styles.statIcon}>🤖</span> Powered by Advanced AI
          </div>
        </div>
      </section>

      {/* The Magic Moment (Look Card Preview) */}
      <section className={styles.magicMoment}>
        <div className={styles.magicContainer}>
          <div className={styles.chatBubbleUser}>
            "Get me ready for a dinner date."
          </div>
          <div className={styles.chatBubbleAi}>
            <div className={styles.magicCard}>
              <div className={styles.magicCardHeader}>
                <h3>Dinner Date Look</h3>
                <span className={styles.confidence}>92% Match ✨</span>
              </div>
              <div className={styles.magicItems}>
                <div className={styles.magicItem}>
                  <div className={styles.magicItemIcon}>👔</div>
                  <div className={styles.magicItemInfo}>
                    <h4>Navy Linen Shirt</h4>
                    <span>From your wardrobe</span>
                  </div>
                </div>
                <div className={styles.magicItem}>
                  <div className={styles.magicItemIcon}>👖</div>
                  <div className={styles.magicItemInfo}>
                    <h4>Beige Chinos</h4>
                    <span>From your wardrobe</span>
                  </div>
                </div>
                <div className={styles.magicItemUpgrade}>
                  <div className={styles.magicItemIcon}>🛒</div>
                  <div className={styles.magicItemInfo}>
                    <h4>Brown Loafers</h4>
                    <span className={styles.upgradeText}>Recommended Upgrade — ₹2,499</span>
                  </div>
                </div>
              </div>
              <div className={styles.magicReasoning}>
                <strong>Why it works:</strong> Navy and beige perfectly complement your warm skin tone. Linen provides texture suitable for an evening setting.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className={styles.features}>
        <h2 className={styles.sectionTitle}>Complete Appearance Intelligence</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🧍</div>
            <h3>Body Digital Twin</h3>
            <p>AI analyzes your physique, proportions, and skin tone from just 2 photos to recommend the perfect fit.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>👔</div>
            <h3>Wardrobe Intelligence</h3>
            <p>Every item digitized, auto-tagged, and ready for AI-powered combinations.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🤖</div>
            <h3>AI Stylist Engine</h3>
            <p>Say "Get me ready for a presentation" and get a complete head-to-toe look instantly.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💇</div>
            <h3>Grooming Intelligence</h3>
            <p>Hairstyle, beard, and glasses recommendations personalized to your exact face shape.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🛒</div>
            <h3>Smart Marketplace</h3>
            <p>Strategic wardrobe upgrades, not random shopping. Every recommendation has a styling reason.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>✨</div>
            <h3>Style Persona</h3>
            <p>Minimalist? Old money? Streetwear? Your AI learns your preferences and adapts to you.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>Three Steps to Your Best Look</h2>
        <div className={styles.stepsContainer}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepIcon}>📸</div>
            <h3>Scan</h3>
            <p>Take 2 photos. Our AI maps your body type, face shape, and style DNA.</p>
          </div>
          <div className={styles.stepConnector} />
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepIcon}>👔</div>
            <h3>Digitize</h3>
            <p>Snap your clothes. AI tags every item automatically to build your digital wardrobe.</p>
          </div>
          <div className={styles.stepConnector} />
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepIcon}>✨</div>
            <h3>Style</h3>
            <p>Ask anything. Get a complete, personalized head-to-toe look in seconds.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={styles.pricing}>
        <h2 className={styles.sectionTitle}>Choose Your Plan</h2>
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
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <span className="gradient-text">GROOMING</span> OS
            </div>
            <p>An AI that designs how you show up in the world.</p>
          </div>
          <div className={styles.footerLinks}>
            <a href="#">About</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact</a>
          </div>
        </div>
        <div className={styles.copyright}>
          &copy; {new Date().getFullYear()} Grooming OS. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
