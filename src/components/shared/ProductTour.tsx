'use client'

import { useState, useEffect } from 'react'
import { Joyride, STATUS, Step } from 'react-joyride'

const TOUR_STEPS: Step[] = [
  {
    target: 'body',
    content: 'Welcome to Grooming OS! Let\'s take a quick tour of your new AI Personal Stylist.',
    placement: 'center',
  },
  {
    target: '#tour-home-overview',
    content: 'This is your dashboard. Here you can see your recent looks, travel capsules, and daily outfit suggestions.',
    placement: 'bottom',
  },
  {
    target: '#nav-wardrobe',
    content: 'Head over to your Wardrobe to digitize your closet. Add your clothes, shoes, and accessories so the AI can style you.',
    placement: 'top',
  },
  {
    target: '#nav-style',
    content: 'Once your wardrobe is set up, visit the Style page to get AI-curated Daily Looks and generate Travel Capsules!',
    placement: 'top',
  },
  {
    target: '#nav-groom',
    content: 'Finally, check out the Groom tab to analyze your facial features and get personalized grooming advice.',
    placement: 'top',
  }
]

export default function ProductTour() {
  const [run, setRun] = useState(false)

  useEffect(() => {
    // Only run tour once per user session/browser
    const hasSeenTour = localStorage.getItem('groomingos_tour_completed')
    if (!hasSeenTour) {
      // Small delay to ensure UI is fully rendered before tour starts
      setTimeout(() => setRun(true), 1000)
    }
  }, [])

  const handleJoyrideCallback = (data: any) => {
    const { status } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      setRun(false)
      localStorage.setItem('groomingos_tour_completed', 'true')
    }
  }

  return (
    <Joyride
      onEvent={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      steps={TOUR_STEPS}
      options={{
        primaryColor: '#8a2be2',
        textColor: '#e1e1e1',
        backgroundColor: '#1a1a1a',
        arrowColor: '#1a1a1a',
        overlayColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 10000,
        showProgress: true,
        buttons: ['back', 'primary', 'skip'],
      }}
      styles={{
        tooltipContainer: {
          textAlign: 'left'
        },
        buttonPrimary: {
          backgroundColor: '#8a2be2',
          borderRadius: '8px',
          fontWeight: 600,
        },
        buttonBack: {
          color: '#e1e1e1',
        },
        buttonSkip: {
          color: '#888',
        }
      }}
    />
  )
}
