'use client'

import { useState, useCallback } from 'react'
import SplitlingsCanvas from '@/components/splitlings-canvas'
import Link from 'next/link'

export default function GamePage() {
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleScoreUpdate = useCallback((s: number, c: number) => {
    setScore(s)
    setCombo(c)
  }, [])

  const handleGameOver = useCallback(async (finalScore: number, finalWave: number) => {
    if (finalScore <= 0) return
    setSubmitting(true)
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: finalScore, wave: finalWave }),
      })
      setSubmitted(true)
    } catch {
      // score submission is best-effort
    } finally {
      setSubmitting(false)
    }
  }, [])

  return (
    <main
      className="fixed inset-0 overflow-hidden"
      style={{ background: 'hsl(230, 25%, 8%)' }}
      data-score={score}
      data-combo={combo}
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
        <div className="flex items-center gap-3">
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

      <SplitlingsCanvas onGameOver={handleGameOver} onScoreUpdate={handleScoreUpdate} />
    </main>
  )
}
