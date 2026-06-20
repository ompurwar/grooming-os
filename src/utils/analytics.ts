// Define our standard tracking events

// Define our standard tracking events
export type TrackEvent = 
  | 'USER_ONBOARDED'
  | 'WARDROBE_ITEM_ADDED'
  | 'WARDROBE_ITEM_DELETED'
  | 'WARDROBE_ITEM_EDITED'
  | 'STYLE_SESSION_STARTED'
  | 'LOOK_GENERATED'
  | 'CAPSULE_GENERATED'
  | 'LOOK_SAVED'

class AnalyticsService {
  private static instance: AnalyticsService
  private initialized = false
  private projectId = ''

  private constructor() {}

  static getInstance() {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  /**
   * Initializes the analytics provider (Clarity).
   * Safe to call multiple times; will only initialize once.
   */
  init(projectId: string) {
    if (typeof window !== 'undefined' && !this.initialized) {
      try {
        // Need to lazy-import or ensure we are on client, clarity is client-only.
        // Wait, @microsoft/clarity exports an object with `init` method.
        const Clarity = require('@microsoft/clarity').default
        Clarity.init(projectId)
        this.projectId = projectId
        this.initialized = true
        console.log('[Analytics] Initialized successfully')
      } catch (e) {
        console.error('[Analytics] Failed to initialize', e)
      }
    }
  }

  /**
   * Links a session to a specific user.
   */
  identify(userId: string) {
    if (!this.initialized) return
    try {
      const Clarity = require('@microsoft/clarity').default
      Clarity.identify(userId)
      console.log(`[Analytics] Identified user ${userId}`)
    } catch (e) {
      console.error('[Analytics] Failed to identify', e)
    }
  }

  /**
   * Tracks a specific user action with optional properties.
   */
  track(event: TrackEvent, properties?: Record<string, string>) {
    if (!this.initialized) return
    try {
      const Clarity = require('@microsoft/clarity').default
      Clarity.event(event)
      
      // Clarity allows setting custom tags which act as properties for filtering
      if (properties) {
        Object.entries(properties).forEach(([key, value]) => {
          Clarity.setTag(key, value)
        })
      }
      
      console.log(`[Analytics] Tracked event: ${event}`, properties || '')
    } catch (e) {
      console.error('[Analytics] Failed to track event', e)
    }
  }
}

export const analytics = AnalyticsService.getInstance()
