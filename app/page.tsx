import { getSession } from '@/lib/auth'
import OrbsBackground from '@/components/orbs-background'
import Link from 'next/link'

export default async function LandingPage() {
  const session = await getSession()

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden">
      <OrbsBackground />

      <div className="relative z-10 w-full max-w-md px-4 text-center">
        <h1
          className="text-6xl font-bold tracking-tight drop-shadow-lg"
          style={{ color: 'var(--primary)' }}
        >
          SPLITLINGS
        </h1>
        <p className="mt-3 text-lg" style={{ color: 'rgba(220,230,255,0.7)' }}>
          Split the orbs before they go supernova
        </p>

        <div className="mt-10 space-y-3">
          <Link
            href="/game"
            className="flex h-14 w-full items-center justify-center rounded-xl text-lg font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Start Playing
          </Link>
          <Link
            href="/leaderboard"
            className="flex h-12 w-full items-center justify-center rounded-xl border text-sm font-medium transition-colors hover:bg-white/5"
            style={{
              borderColor: 'rgba(255,255,255,0.2)',
              color: 'rgba(220,230,255,0.8)',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(8px)',
            }}
          >
            View Leaderboard
          </Link>
        </div>

        <div
          className="mt-10 rounded-xl border p-5 text-left"
          style={{
            borderColor: 'rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <h3 className="mb-3 font-semibold" style={{ color: 'rgba(220,230,255,0.9)' }}>
            How to Play
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: 'rgba(180,200,240,0.7)' }}>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--primary)' }}>1.</span>
              <span>Tap orbs to split them into smaller pieces</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--primary)' }}>2.</span>
              <span>Chain same colors for combo multipliers</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--primary)' }}>3.</span>
              <span>Manage your energy bar wisely</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--primary)' }}>4.</span>
              <span className="font-medium" style={{ color: 'rgba(220,230,255,0.9)' }}>
                Tap and hold anywhere for menu
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--destructive)' }}>5.</span>
              <span>Don&apos;t let orbs reach supernova size!</span>
            </li>
          </ul>
        </div>

        {!session && (
          <p className="mt-6 text-xs" style={{ color: 'rgba(150,170,210,0.55)' }}>
            <Link href="/auth/login" className="hover:underline" style={{ color: 'var(--primary)' }}>
              Sign in to save scores →
            </Link>
          </p>
        )}
        {session && (
          <p className="mt-6 text-xs" style={{ color: 'rgba(150,170,210,0.5)' }}>
            Playing as <span style={{ color: 'var(--primary)' }}>{session.username}</span>
          </p>
        )}
      </div>
    </main>
  )
}
