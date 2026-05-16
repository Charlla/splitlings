import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { deleteSession } from '@/lib/auth'

const COOKIE_NAME = 'splitlings_session'

export async function POST(_req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (token) {
    await deleteSession(token)
  }

  cookieStore.set({
    name: COOKIE_NAME,
    value: '',
    maxAge: 0,
    path: '/',
  })

  return NextResponse.json({ ok: true })
}
