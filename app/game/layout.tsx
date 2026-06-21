import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/seo'

// The game page itself is a client component, so route metadata lives here.
export const metadata: Metadata = {
  title: 'Play Splitlings',
  description:
    'Play Splitlings free in your browser. Tap orbs to split them, chain same-color combos, manage your energy, and survive before any orb goes supernova.',
  alternates: { canonical: '/game' },
  openGraph: {
    title: 'Play Splitlings — free tap-to-split arcade game',
    description:
      'Play Splitlings free in your browser. Tap orbs to split them, chain same-color combos, manage your energy, and survive before any orb goes supernova.',
    url: `${SITE_URL}/game`,
  },
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return children
}
