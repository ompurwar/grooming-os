'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './BottomNav.module.css'

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: '🏠' },
  { href: '/wardrobe', label: 'Wardrobe', icon: '👔' },
  { href: '/style', label: 'Style', icon: '✨' },
  { href: '/groom', label: 'Groom', icon: '💇‍♂️' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

export default function BottomNav() {
  const pathname = usePathname()

  // Don't render bottom nav on non-dashboard pages (like auth or onboarding)
  const isDashboardPage = NAV_ITEMS.some(item => pathname.startsWith(item.href))
  if (!isDashboardPage && pathname !== '/home') return null

  return (
    <nav className={styles.bottomNav}>
      <ul className={styles.navList}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <li key={item.href} className={styles.navItem}>
              <Link 
                href={item.href} 
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                id={`nav-${item.label.toLowerCase()}`}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.label}>{item.label}</span>
                {isActive && <span className={styles.indicator} />}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
