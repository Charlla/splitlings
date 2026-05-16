import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getServiceClient, createSessionToken, sessionCookieOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const db = getServiceClient()

    const { data: player, error } = await db
      .from('splitlings_players')
      .select('id, username, email, password_hash')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !player) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, player.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = await createSessionToken(player.id)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await db.from('splitlings_sessions').insert({
      player_id: player.id,
      token,
      expires_at: expiresAt.toISOString(),
    })

    const cookieStore = await cookies()
    cookieStore.set(sessionCookieOptions(token))

    return NextResponse.json({
      player: { id: player.id, username: player.username, email: player.email },
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
