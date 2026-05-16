import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ player: null }, { status: 401 })
  }
  return NextResponse.json({ player: session })
}
