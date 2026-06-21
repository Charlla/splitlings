import type { Metadata, Viewport } from 'next'
import './globals.css'
import JsonLd from '@/components/JsonLd'
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESCRIPTION,
  OG_IMAGE,
  organizationJsonLd,
} from '@/lib/seo'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'Splitlings',
    'arcade game',
    'tap to split',
    'orb game',
    'browser game',
    'free online game',
    'combo multiplier',
    'high score',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: SITE_URL,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: `${SITE_NAME} key art` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
}

// viewport-fit=cover lets the game canvas extend under notches; safe-area
// insets keep the HUD readable. No maximum-scale — accessibility pinch-zoom
// stays on (iOS focus-zoom is handled by the 16px input rule in globals.css).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0c1024',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <JsonLd data={organizationJsonLd} />
        {children}
      </body>
    </html>
  )
}
