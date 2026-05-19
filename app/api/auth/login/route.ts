import { NextResponse } from 'next/server'

// Disabled: password login replaced with OTP.
export async function POST() {
  return NextResponse.json(
    { error: 'Password login is disabled. Use OTP sign-in instead.' },
    { status: 410 },
  )
}
