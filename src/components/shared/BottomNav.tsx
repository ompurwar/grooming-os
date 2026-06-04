'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './BottomNav.module.css'

import { Home, Shirt, Sparkles, Scissors, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/wardrobe', label: 'Wardrobe', icon: Shirt },
  { href: '/style', label: 'Style', icon: Sparkles },
  { href: '/groom', label: 'Groom', icon: Scissors },
  { href: '/profile', label: 'Profile', icon: User },
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

          const Icon = item.icon
          return (
            <li key={item.href} className={styles.navItem}>
              <Link 
                href={item.href} 
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                id={`nav-${item.label.toLowerCase()}`}
              >
                <span className={styles.icon}><Icon size={24} /></span>
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
