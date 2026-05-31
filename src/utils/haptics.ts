/**
 * Safely triggers haptic feedback on devices that support it.
 * @param pattern - Duration in ms, or an array of durations [vibrate, pause, vibrate...]
 */
export function triggerHaptic(pattern: number | number[] = 50) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch (e) {
      // Ignore errors (e.g. user hasn't interacted with document yet)
    }
  }
}

export const hapticPatterns = {
  light: 30,
  medium: 50,
  heavy: 80,
  success: [30, 50, 40],
  error: [50, 50, 50, 50, 50],
}
