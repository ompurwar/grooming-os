'use client'

import { useEffect } from 'react'
import { analytics } from '@/utils/analytics'
import { createClient } from '@/utils/supabase/client'

const CLARITY_PROJECT_ID = 'xa56ghjnwf' // Hardcoded as requested

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1. Initialize Analytics
    analytics.init(CLARITY_PROJECT_ID)

    // 2. Identify the user on mount and listen to auth changes
    const supabase = createClient()
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        analytics.identify(session.user.id)
      }
    })

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.id) {
        analytics.identify(session.user.id)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <>{children}</>
}
