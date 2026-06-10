'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import SplitlingsCanvas, { type ScoreSubmitState } from '@/components/splitlings-canvas'
import Link from 'next/link'

export default function GamePage() {
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [submitState, setSubmitState] = useState<ScoreSubmitState>('idle')
  const [isGuest, setIsGuest] = useState<boolean | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const lastRunRef = useRef<{ score: number; wave: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          setIsGuest(false)
          setUsername(data?.player?.username ?? data?.username ?? null)
        } else {
          setIsGuest(true)
        }
      } catch {
        if (!cancelled) setIsGuest(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleScoreUpdate = useCallback((s: number, c: number) => {
    setScore(s)
    setCombo(c)
  }, [])

  const submitScore = useCallback(async (finalScore: number, finalWave: number) => {
    setSubmitState('saving')
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: finalScore, wave: finalWave }),
      })
      setSubmitState(res.ok ? 'saved' : 'error')
    } catch {
      setSubmitState('error')
    }
  }, [])

  const handleGameOver = useCallback(
    (finalScore: number, finalWave: number) => {
      lastRunRef.current = { score: finalScore, wave: finalWave }
      if (finalScore <= 0) return
      if (isGuest !== false) return // only submit if confirmed logged in
      void submitScore(finalScore, finalWave)
    },
    [isGuest, submitScore],
  )

  const handleRetrySubmit = useCallback(() => {
    const run = lastRunRef.current
    if (run && run.score > 0) void submitScore(run.score, run.wave)
  }, [submitScore])

  const handleRestart = useCallback(() => {
    setSubmitState('idle')
  }, [])

  return (
    <main
      className="fixed inset-0 overflow-hidden"
      style={{ background: 'hsl(230, 25%, 8%)' }}
      data-score={score}
      data-combo={combo}
      data-guest={isGuest === true ? 'true' : isGuest === false ? 'false' : 'unknown'}
    >
      {/* Top nav bar — left cluster only; the canvas Menu button owns the right side */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-center px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4px)' }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            aria-label="Back to Splitlings home"
            className="pointer-events-auto inline-flex min-h-11 items-center font-mono text-xs font-bold tracking-widest text-game-accent/60 transition-colors hover:text-game-accent"
          >
            SPLITLINGS
          </Link>
          {username && (
            <span className="max-w-[40vw] truncate text-xs text-game-ink-faint">{username}</span>
          )}
          {isGuest === true && (
            <Link
              href="/auth/login?next=/game"
              className="pointer-events-auto inline-flex min-h-11 items-center text-xs text-game-accent/80 underline underline-offset-2 hover:text-game-accent"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      <SplitlingsCanvas
        onGameOver={handleGameOver}
        onScoreUpdate={handleScoreUpdate}
        onRestart={handleRestart}
        isGuest={isGuest === true}
        submitState={submitState}
        onRetrySubmit={handleRetrySubmit}
      />
    </main>
  )
}
