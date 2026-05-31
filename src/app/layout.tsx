import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Grooming OS — Your AI Personal Stylist',
    template: '%s | Grooming OS',
  },
  description:
    'An AI-powered personal grooming platform that knows your body, your wardrobe, and the market. Get styled head to toe in seconds.',
  keywords: [
    'AI stylist',
    'personal grooming',
    'wardrobe management',
    'fashion AI',
    'outfit recommendations',
    'style intelligence',
  ],
  authors: [{ name: 'Grooming OS' }],
  openGraph: {
    title: 'Grooming OS — Your AI Personal Stylist',
    description:
      'An AI that designs how you show up in the world. Body analysis, wardrobe intelligence, and complete appearance orchestration.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Grooming OS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grooming OS — Your AI Personal Stylist',
    description:
      'An AI that designs how you show up in the world.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0b',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
