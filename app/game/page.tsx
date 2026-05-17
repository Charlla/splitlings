'use client'

import { useState, useCallback, useEffect } from 'react'
import SplitlingsCanvas from '@/components/splitlings-canvas'
import Link from 'next/link'

export default function GamePage() {
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isGuest, setIsGuest] = useState<boolean | null>(null)
  const [username, setUsername] = useState<string | null>(null)

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

  const handleGameOver = useCallback(
    async (finalScore: number, finalWave: number) => {
      if (finalScore <= 0) return
      if (isGuest !== false) return // only submit if confirmed logged in
      setSubmitting(true)
      try {
        const res = await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ score: finalScore, wave: finalWave }),
        })
        if (res.ok) setSubmitted(true)
      } catch {
        // best-effort
      } finally {
        setSubmitting(false)
      }
    },
    [isGuest],
  )

  return (
    <main
      className="fixed inset-0 overflow-hidden"
      style={{ background: 'hsl(230, 25%, 8%)' }}
      data-score={score}
      data-combo={combo}
      data-guest={isGuest === true ? 'true' : isGuest === false ? 'false' : 'unknown'}
    >
      {/* Top nav bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto text-xs font-bold tracking-widest opacity-50 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--primary)' }}
        >
          SPLITLINGS
        </Link>
        <div className="flex items-center gap-3 pointer-events-auto">
          {username && (
            <span className="text-xs opacity-60" style={{ color: 'var(--muted-foreground)' }}>
              {username}
            </span>
          )}
          {isGuest === true && (
            <Link
              href="/auth/login"
              className="text-xs opacity-60 hover:opacity-90 underline underline-offset-2"
              style={{ color: 'var(--primary)' }}
            >
              Sign in
            </Link>
          )}
          {submitting && (
            <span className="text-xs opacity-50" style={{ color: 'var(--muted-foreground)' }}>
              Saving…
            </span>
          )}
          {submitted && !submitting && (
            <span className="text-xs" style={{ color: 'var(--primary)' }}>
              Score saved!
            </span>
          )}
        </div>
      </div>

      <SplitlingsCanvas
        onGameOver={handleGameOver}
        onScoreUpdate={handleScoreUpdate}
        isGuest={isGuest === true}
      />
    </main>
  )
}
