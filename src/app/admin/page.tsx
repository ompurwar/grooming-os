'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { isAdminEmail } from '@/utils/admin'
import {
  Users, Shirt, Sparkles, Bookmark, ScanFace, PersonStanding,
  Package, Shield, ArrowLeft, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Search
} from 'lucide-react'
import styles from './page.module.css'

interface UserData {
  id: string
  email: string
  fullName: string | null
  joinedAt: string
  wardrobeCount: number
  outfitCount: number
  savedCount: number
  hasBodyScan: boolean
  hasFaceScan: boolean
}

interface AdminStats {
  overview: {
    totalUsers: number
    totalWardrobeItems: number
    totalOutfits: number
    totalSavedOutfits: number
    totalBodyScans: number
    totalFaceScans: number
    totalCapsules: number
  }
  users: UserData[]
}

type SortKey = 'joinedAt' | 'wardrobeCount' | 'outfitCount' | 'savedCount'

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [authState, setAuthState] = useState<'checking' | 'denied' | 'granted'>('checking')
  const [sortKey, setSortKey] = useState<SortKey>('joinedAt')
  const [sortAsc, setSortAsc] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  useEffect(() => {
    async function checkAccessAndFetch() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user || !isAdminEmail(session.user.email)) {
        setAuthState('denied')
        setLoading(false)
        return
      }

      setAuthState('granted')

      try {
        const res = await fetch('/api/admin/stats')
        if (!res.ok) {
          setAuthState('denied')
          setLoading(false)
          return
        }
        const data = await res.json()
        setStats(data)
      } catch (err) {
        console.error('Failed to fetch admin stats:', err)
      } finally {
        setLoading(false)
      }
    }
    checkAccessAndFetch()
  }, [])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  const filteredUsers = (stats?.users || [])
    .filter(u => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        u.email.toLowerCase().includes(q) ||
        (u.fullName && u.fullName.toLowerCase().includes(q))
      )
    })
    .sort((a, b) => {
      let valA: number | string = a[sortKey]
      let valB: number | string = b[sortKey]
      if (sortKey === 'joinedAt') {
        valA = new Date(a.joinedAt).getTime()
        valB = new Date(b.joinedAt).getTime()
      }
      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <p>Verifying admin access…</p>
      </div>
    )
  }

  if (authState === 'denied') {
    return (
      <div className={styles.deniedScreen}>
        <Shield size={48} />
        <h1>Access Denied</h1>
        <p>You don&apos;t have permission to view this page.</p>
        <button onClick={() => router.push('/home')} className={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Home
        </button>
      </div>
    )
  }

  if (!stats) return null

  const { overview } = stats

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => router.push('/home')} className={styles.backLink}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className={styles.title}>Admin Dashboard</h1>
            <p className={styles.subtitle}>
              <Shield size={14} /> System Overview
            </p>
          </div>
        </div>
        <div className={styles.badge}>
          <span className={styles.liveDot} />
          Live
        </div>
      </header>

      {/* Overview Stats */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrap} data-accent="blue">
            <Users size={22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>{overview.totalUsers}</span>
            <span className={styles.statLabel}>Registered Users</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} data-accent="gold">
            <Shirt size={22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>{overview.totalWardrobeItems}</span>
            <span className={styles.statLabel}>Wardrobe Items</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} data-accent="purple">
            <Sparkles size={22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>{overview.totalOutfits}</span>
            <span className={styles.statLabel}>Looks Generated</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} data-accent="green">
            <Bookmark size={22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>{overview.totalSavedOutfits}</span>
            <span className={styles.statLabel}>Saved Looks</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} data-accent="teal">
            <PersonStanding size={22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>{overview.totalBodyScans}</span>
            <span className={styles.statLabel}>Body Scans</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} data-accent="pink">
            <ScanFace size={22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>{overview.totalFaceScans}</span>
            <span className={styles.statLabel}>Face Scans</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrap} data-accent="orange">
            <Package size={22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statNumber}>{overview.totalCapsules}</span>
            <span className={styles.statLabel}>Capsules</span>
          </div>
        </div>
      </section>

      {/* Users Table */}
      <section className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            User Breakdown
            <span className={styles.countChip}>{filteredUsers.length}</span>
          </h2>
          <div className={styles.searchBox}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th className={styles.sortable} onClick={() => handleSort('joinedAt')}>
                  Joined {sortKey === 'joinedAt' && (sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('wardrobeCount')}>
                  Wardrobe {sortKey === 'wardrobeCount' && (sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('outfitCount')}>
                  Looks {sortKey === 'outfitCount' && (sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th className={styles.sortable} onClick={() => handleSort('savedCount')}>
                  Saved {sortKey === 'savedCount' && (sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </th>
                <th>Body Scan</th>
                <th>Face Scan</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.userAvatar}>
                        {(user.fullName || user.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.userName}>{user.fullName || '—'}</div>
                        <div className={styles.userEmail}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.mono}>
                    {new Date(user.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td>
                    <span className={`${styles.metric} ${user.wardrobeCount > 0 ? styles.metricActive : ''}`}>
                      {user.wardrobeCount}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.metric} ${user.outfitCount > 0 ? styles.metricActive : ''}`}>
                      {user.outfitCount}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.metric} ${user.savedCount > 0 ? styles.metricActive : ''}`}>
                      {user.savedCount}
                    </span>
                  </td>
                  <td>
                    {user.hasBodyScan ? (
                      <CheckCircle2 size={18} className={styles.checkIcon} />
                    ) : (
                      <XCircle size={18} className={styles.crossIcon} />
                    )}
                  </td>
                  <td>
                    {user.hasFaceScan ? (
                      <CheckCircle2 size={18} className={styles.checkIcon} />
                    ) : (
                      <XCircle size={18} className={styles.crossIcon} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className={styles.mobileCards}>
          {filteredUsers.map(user => (
            <div
              key={user.id}
              className={`${styles.mobileCard} ${expandedUser === user.id ? styles.mobileCardExpanded : ''}`}
              onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
            >
              <div className={styles.mobileCardHeader}>
                <div className={styles.userCell}>
                  <div className={styles.userAvatar}>
                    {(user.fullName || user.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <div className={styles.userName}>{user.fullName || '—'}</div>
                    <div className={styles.userEmail}>{user.email}</div>
                  </div>
                </div>
                <div className={styles.mobileChevron}>
                  {expandedUser === user.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {expandedUser === user.id && (
                <div className={styles.mobileCardBody}>
                  <div className={styles.mobileMetricRow}>
                    <span className={styles.mobileMetricLabel}>Joined</span>
                    <span className={styles.mono}>
                      {new Date(user.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className={styles.mobileMetricRow}>
                    <span className={styles.mobileMetricLabel}>Wardrobe Items</span>
                    <span className={`${styles.metric} ${user.wardrobeCount > 0 ? styles.metricActive : ''}`}>{user.wardrobeCount}</span>
                  </div>
                  <div className={styles.mobileMetricRow}>
                    <span className={styles.mobileMetricLabel}>Looks Generated</span>
                    <span className={`${styles.metric} ${user.outfitCount > 0 ? styles.metricActive : ''}`}>{user.outfitCount}</span>
                  </div>
                  <div className={styles.mobileMetricRow}>
                    <span className={styles.mobileMetricLabel}>Saved Looks</span>
                    <span className={`${styles.metric} ${user.savedCount > 0 ? styles.metricActive : ''}`}>{user.savedCount}</span>
                  </div>
                  <div className={styles.mobileMetricRow}>
                    <span className={styles.mobileMetricLabel}>Body Scan</span>
                    {user.hasBodyScan ? <CheckCircle2 size={16} className={styles.checkIcon} /> : <XCircle size={16} className={styles.crossIcon} />}
                  </div>
                  <div className={styles.mobileMetricRow}>
                    <span className={styles.mobileMetricLabel}>Face Scan</span>
                    {user.hasFaceScan ? <CheckCircle2 size={16} className={styles.checkIcon} /> : <XCircle size={16} className={styles.crossIcon} />}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
