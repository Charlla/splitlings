import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getServiceClient, createSessionToken, sessionCookieOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'username, email and password are required' }, { status: 400 })
    }
    if (username.length < 2 || username.length > 24) {
      return NextResponse.json({ error: 'Username must be 2–24 characters' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const db = getServiceClient()

    // Check for existing username or email
    const { data: existing } = await db
      .from('splitlings_players')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Email or username already taken' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const { data: player, error: insertError } = await db
      .from('splitlings_players')
      .insert({ username, email, password_hash: passwordHash })
      .select('id, username, email')
      .single()

    if (insertError || !player) {
      console.error('Register insert error:', insertError)
      return NextResponse.json({ error: 'Could not create account' }, { status: 500 })
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

    return NextResponse.json({ player: { id: player.id, username: player.username, email: player.email } })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
