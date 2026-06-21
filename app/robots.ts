import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

// Private / non-content surfaces. Marketing + gameplay + leaderboard stay open;
// API, auth flows, and any admin/lab surfaces are excluded.
const DISALLOW = ['/api/', '/admin', '/lab', '/auth/']

// AI / answer-engine crawlers we explicitly welcome for public content (GEO).
const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'PerplexityBot',
  'Google-Extended',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: '/', disallow: DISALLOW })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
