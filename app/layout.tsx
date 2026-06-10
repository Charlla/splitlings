import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Splitlings — Split the orbs before they go supernova',
  description:
    'A fast-paced browser game where you tap orbs to split them before they grow to supernova size. Chain same-color splits for combo multipliers.',
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
      <body className="h-full">{children}</body>
    </html>
  )
}
