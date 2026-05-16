import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import * as jose from 'jose'

const COOKIE_NAME = 'splitlings_session'
const JWT_SECRET = process.env.JWT_SECRET!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export function getServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export interface SessionPlayer {
  id: string
  username: string
  email: string
}

export async function getSession(): Promise<SessionPlayer | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jose.jwtVerify(token, secret)
    const db = getServiceClient()
    const { data } = await db
      .from('splitlings_sessions')
      .select('player_id, splitlings_players(id, username, email)')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!data) return null
    const player = (data as any).splitlings_players
    return { id: player.id, username: player.username, email: player.email }
  } catch {
    return null
  }
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  }
}

export async function createSessionToken(playerId: string): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET)
  const token = await new jose.SignJWT({ sub: playerId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)
  return token
}

export async function deleteSession(token: string) {
  const db = getServiceClient()
  await db.from('splitlings_sessions').delete().eq('token', token)
}
