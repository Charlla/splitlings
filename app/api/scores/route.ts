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

  const { score, wave } = await req.json()

  if (typeof score !== 'number' || score < 0) {
    return NextResponse.json({ error: 'Invalid score' }, { status: 400 })
  }

  const db = getServiceClient()
  const { data, error } = await db
    .from('splitlings_scores')
    .insert({
      player_id: session.id,
      score: Math.round(score),
      wave: typeof wave === 'number' ? Math.round(wave) : 1,
    })
    .select('id, score, wave')
    .single()

  if (error) {
    console.error('Score insert error:', error)
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 })
  }

  return NextResponse.json({ score: data })
}
