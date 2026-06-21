// Centralized SEO / discoverability constants and JSON-LD builders.
// Keep facts here consistent with page copy, metadata, and llms.txt (no drift).

// Canonical host is www — the apex (splitlings.com) 307-redirects to www, so
// all absolute URLs (canonical, sitemap, OG, JSON-LD) must point at www to
// avoid pointing search engines/LLMs at a redirecting URL.
export const SITE_URL = 'https://www.splitlings.com'
export const SITE_NAME = 'Splitlings'
export const SITE_TAGLINE = 'Split the orbs before they go supernova'
export const SITE_DESCRIPTION =
  'Splitlings is a free tap-to-split arcade game: tap glowing orbs to split them before they go supernova, chain same-color combos, and climb the leaderboard.'
export const OG_IMAGE = `${SITE_URL}/og.png`
export const PUBLISHER_NAME = 'Bot & Botty'
export const PUBLISHER_URL = 'https://botandbotty.com'

/** Organization + WebSite graph for the root layout (every page). */
export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/title-hero.png`,
      description: SITE_DESCRIPTION,
      sameAs: [PUBLISHER_URL],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: 'en',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
}

/** VideoGame schema for the marketing/landing page. */
export const videoGameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  '@id': `${SITE_URL}/#game`,
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  image: OG_IMAGE,
  inLanguage: 'en',
  applicationCategory: 'GameApplication',
  genre: ['Arcade', 'Action', 'Casual'],
  gamePlatform: ['Web browser'],
  operatingSystem: 'Any (modern web browser)',
  playMode: 'SinglePlayer',
  publisher: { '@type': 'Organization', name: PUBLISHER_NAME, url: PUBLISHER_URL },
  author: { '@type': 'Organization', name: PUBLISHER_NAME, url: PUBLISHER_URL },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  },
}

/** FAQPage schema — real Q&A consistent with the landing-page copy. */
export const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do you play Splitlings?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tap orbs to split them into smaller pieces. Same-colored orbs merge — the bigger orb eats the smaller — and everything keeps growing. Chain same-color splits for combo multipliers, manage your energy bar, and never let an orb reach supernova size.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Splitlings free to play?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Splitlings is completely free to play in your web browser on mobile or desktop — no download or purchase required.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need an account to play?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No account is needed to play. Sign in with a one-time email code only if you want to save your scores to the global leaderboard.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do combos work in Splitlings?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Splitting orbs of the same color in a row builds a combo multiplier that increases your score. Break the chain and the multiplier resets, so plan which orbs to split.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I open the pause menu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Use the ≡ Menu button in the top-right of the screen, or tap and hold anywhere on the play field, to open the pause overlay.',
      },
    },
  ],
}
