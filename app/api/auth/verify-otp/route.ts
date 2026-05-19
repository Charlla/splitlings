import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { otp, isValidEmail } from '@/lib/otp'
import { getServiceClient, createSessionToken, sessionCookieOptions } from '@/lib/auth'

function deriveUsername(email: string): string {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24) || 'orb'
}

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email.' }, { status: 400 })
    }
    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Enter the 6-digit code.' }, { status: 400 })
    }

    const ok = await otp.verifyEmailOTP(email, code)
    if (!ok) {
      return NextResponse.json({ error: 'Incorrect or expired code.' }, { status: 401 })
    }

    const normalised = email.trim().toLowerCase()
    const db = getServiceClient()

    let { data: player } = await db
      .from('splitlings_players')
      .select('id, username, email')
      .eq('email', normalised)
      .maybeSingle()

    if (!player) {
      let username = deriveUsername(normalised)
      for (let i = 0; i < 5; i++) {
        const { data: clash } = await db
          .from('splitlings_players')
          .select('id')
          .eq('username', username)
          .maybeSingle()
        if (!clash) break
        username = `${deriveUsername(normalised)}${Math.floor(Math.random() * 9000) + 1000}`
      }
      const { data: created, error } = await db
        .from('splitlings_players')
        .insert({ email: normalised, username })
        .select('id, username, email')
        .single()
      if (error || !created) {
        console.error('[verify-otp] create player', error)
        return NextResponse.json({ error: 'Could not create account.' }, { status: 500 })
      }
      player = created
    }

    const token = await createSessionToken(player.id)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await db.from('splitlings_sessions').insert({
      player_id: player.id,
      token,
      expires_at: expiresAt.toISOString(),
    })

    const cookieStore = await cookies()
    const opts = sessionCookieOptions(token)
    cookieStore.set(opts.name, opts.value, opts)

    return NextResponse.json({ ok: true, player })
  } catch (err) {
    console.error('[verify-otp]', err)
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 })
  }
}
