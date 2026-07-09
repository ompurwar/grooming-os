'use client'

import { useState, useEffect } from 'react'

export default function TypewriterText({ text, speed = 20 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    setDisplayedText('')
    let i = 0
    const intervalId = setInterval(() => {
      setDisplayedText(text.slice(0, i))
      i++
      if (i > text.length) {
        clearInterval(intervalId)
      }
    }, speed)
    
    return () => clearInterval(intervalId)
  }, [text, speed])

  return <span>{displayedText}</span>
}
