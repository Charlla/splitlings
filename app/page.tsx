import { getSession } from '@/lib/auth'
import OrbsBackground from '@/components/orbs-background'
import Image from 'next/image'
import Link from 'next/link'

const neonBase =
  'inline-flex items-center justify-center gap-2 rounded-game-pill font-mono font-black uppercase ' +
  'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-game-accent/60 ' +
  'w-full'
const neonPrimary =
  'h-14 px-10 text-base tracking-[4px] text-game-deep shadow-game-glow-md hover:shadow-game-glow-lg ' +
  'bg-[linear-gradient(180deg,var(--game-accent)_0%,color-mix(in_oklab,var(--game-accent)_70%,var(--game-accent-2))_100%)]'
const neonGhost =
  'h-12 px-6 text-sm tracking-[4px] text-game-ink bg-transparent border border-game-border-strong hover:bg-game-surface hover:border-game-accent/60'

export default async function LandingPage() {
  const session = await getSession()

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-game-deep">
      <OrbsBackground />

      {/* Hero — AI-generated title art behind content */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-start justify-center"
      >
        <div
          className="relative w-[min(86vw,440px)] aspect-square mt-[6vh] opacity-90"
          style={{
            maskImage: 'radial-gradient(circle at center, black 55%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 55%, transparent 78%)',
          }}
        >
          <Image
            src="/title-hero.png"
            alt="Splitlings"
            fill
            sizes="(max-width: 440px) 86vw, 440px"
            className="object-contain"
            priority
          />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md px-4 text-center mt-[44vh]">
        <p className="text-[11px] tracking-[5px] uppercase text-game-ink-muted font-mono mb-2">
          Tap · Split · Survive
        </p>
        <p className="text-base sm:text-lg text-game-ink-muted mb-8">
          Split the orbs before they go supernova
        </p>

        <div className="space-y-3">
          <Link href="/game"        className={`${neonBase} ${neonPrimary}`}>Start Playing</Link>
          <Link href="/leaderboard" className={`${neonBase} ${neonGhost}`}>View Leaderboard</Link>
        </div>

        <div
          className="mt-8 rounded-game-lg border border-game-border bg-game-surface/60 backdrop-blur-md p-5 text-left"
        >
          <h3 className="mb-3 font-semibold text-game-ink font-mono uppercase text-xs tracking-[3px]">
            How to Play
          </h3>
          <ul className="space-y-2 text-sm text-game-ink-muted">
            <li className="flex items-start gap-2">
              <span className="text-game-accent font-bold">1.</span>
              <span>Tap orbs to split them into smaller pieces</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-game-accent font-bold">2.</span>
              <span>Chain same colors for combo multipliers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-game-accent font-bold">3.</span>
              <span>Manage your energy bar wisely</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-game-accent font-bold">4.</span>
              <span className="text-game-ink font-medium">Tap and hold anywhere for menu</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-game-danger font-bold">5.</span>
              <span>Don&apos;t let orbs reach supernova size!</span>
            </li>
          </ul>
        </div>

        {!session && (
          <p className="mt-6 mb-4 text-xs text-game-ink-faint">
            <Link href="/auth/login" className="text-game-accent hover:underline">
              Sign in to save scores →
            </Link>
          </p>
        )}
        {session && (
          <p className="mt-6 mb-4 text-xs text-game-ink-faint">
            Playing as <span className="text-game-accent font-bold">{session.username}</span>
          </p>
        )}
      </div>
    </main>
  )
}
