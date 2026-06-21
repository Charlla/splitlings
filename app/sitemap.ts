import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'
import { getServiceClient } from '@/lib/auth'

// Public, indexable routes only. Auth flows + API are excluded (see robots.ts).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Leaderboard freshness is driven by the latest saved score (dynamic from DB).
  let leaderboardModified = now
  try {
    const db = getServiceClient()
    const { data } = await db
      .from('splitlings_scores')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data?.created_at) leaderboardModified = new Date(data.created_at)
  } catch {
    // Fall back to `now` if the DB is unreachable at build/request time.
  }

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    {
      url: `${SITE_URL}/game`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/leaderboard`,
      lastModified: leaderboardModified,
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ]
}
