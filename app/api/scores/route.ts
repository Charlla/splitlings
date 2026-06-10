import { NextRequest, NextResponse } from 'next/server'
import { getSession, getServiceClient } from '@/lib/auth'

export async function GET() {
  const db = getServiceClient()
  const { data, error } = await db
    .from('splitlings_scores')
    .select('id, score, wave, created_at, splitlings_players(username)')
    .order('score', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 })
  }

  return NextResponse.json({ scores: data })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Sign in to submit your score' },
      { status: 401 },
    )
  }

  const body = await req.json().catch(() => null)
  const rawScore = body?.score
  const rawWave = body?.wave ?? 1

  // Sanity bounds. Theoretical max ≈ 26 splits/wave × 4 800 pts/split ≈ 125k
  // (energy-limited) plus absorption cascade points (≤ ~230 each, ~2 per
  // split ≈ 12k) ≈ 137k per 15s wave — real play is far below. Anything
  // outside these envelopes is a forged payload, not a game.
  const MAX_WAVE = 500
  const MAX_SCORE = 5_000_000
  const MAX_PER_WAVE = 150_000

  if (typeof rawScore !== 'number' || !Number.isFinite(rawScore) || rawScore <= 0) {
    return NextResponse.json({ error: 'Invalid score' }, { status: 400 })
  }
  if (typeof rawWave !== 'number' || !Number.isFinite(rawWave)) {
    return NextResponse.json({ error: 'Invalid wave' }, { status: 400 })
  }
  const score = Math.round(rawScore)
  const wave = Math.round(rawWave)
  if (wave < 1 || wave > MAX_WAVE) {
    return NextResponse.json({ error: 'Invalid wave' }, { status: 400 })
  }
  if (score > MAX_SCORE || score > wave * MAX_PER_WAVE) {
    return NextResponse.json({ error: 'Score failed validation' }, { status: 400 })
  }

  const db = getServiceClient()
  const { data, error } = await db
    .from('splitlings_scores')
    .insert({
      player_id: session.id,
      score,
      wave,
    })
    .select('id, score, wave')
    .single()

  if (error) {
    console.error('Score insert error:', error)
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 })
  }

  return NextResponse.json({ score: data })
}
