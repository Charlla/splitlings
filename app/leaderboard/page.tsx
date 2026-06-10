import { getServiceClient } from '@/lib/auth'
import Link from 'next/link'

export const revalidate = 60

interface ScoreRow {
  id: string
  score: number
  wave: number
  created_at: string
  splitlings_players: { username: string } | null
}

export default async function LeaderboardPage() {
  const db = getServiceClient()
  const { data: scores } = await db
    .from('splitlings_scores')
    .select('id, score, wave, created_at, splitlings_players(username)')
    .order('score', { ascending: false })
    .limit(50)

  const rows = (scores ?? []) as unknown as ScoreRow[]

  return (
    <main
      className="min-h-svh"
      style={{ background: 'hsl(230, 25%, 8%)' }}
    >
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--primary)' }}
          >
            SPLITLINGS
          </Link>
          <Link
            href="/game"
            className="inline-flex min-h-11 items-center px-4 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Play
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
          Leaderboard
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
          Top 50 all-time scores
        </p>

        {rows.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'var(--muted-foreground)' }}>
            <p className="text-4xl mb-4">🔮</p>
            <p className="text-lg font-medium mb-2">No scores yet</p>
            <p className="text-sm">Be the first to play and claim the top spot!</p>
            <Link
              href="/game"
              className="inline-block mt-6 px-6 py-3 rounded-xl font-medium"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              Start Playing
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left text-xs font-semibold tracking-wider uppercase"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--muted-foreground)' }}
                >
                  <th className="px-4 py-3 w-10">#</th>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3 text-right">Score</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Wave</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const isTop3 = i < 3
                  const rankColors = ['hsl(55,90%,60%)', 'hsl(220,15%,70%)', 'hsl(25,80%,55%)']
                  const rankColor = isTop3 ? rankColors[i] : 'var(--muted-foreground)'

                  return (
                    <tr
                      key={row.id}
                      className="border-t transition-colors hover:bg-white/[0.02]"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <td className="px-4 py-3 font-mono font-bold" style={{ color: rankColor }}>
                        {i + 1}
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--foreground)' }}>
                        {row.splitlings_players?.username ?? 'Anonymous'}
                        {isTop3 && (
                          <span className="ml-2 text-xs">
                            {i === 0 ? '👑' : i === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold" style={{ color: 'var(--primary)' }}>
                        {row.score.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell" style={{ color: 'var(--muted-foreground)' }}>
                        {row.wave}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell" style={{ color: 'var(--muted-foreground)' }}>
                        {new Date(row.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
