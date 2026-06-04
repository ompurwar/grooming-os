import { Metadata } from 'next'
import BottomNav from '@/components/shared/BottomNav'
import ProductTour from '@/components/shared/ProductTour'
import styles from './layout.module.css'

export const metadata: Metadata = {
  title: 'Dashboard | Grooming OS',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={styles.dashboardContainer}>
      <ProductTour />
      <main className={styles.mainContent}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
