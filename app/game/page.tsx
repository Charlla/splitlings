'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import SplitlingsCanvas, { type ScoreSubmitState } from '@/components/splitlings-canvas'

export default function GamePage() {
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [submitState, setSubmitState] = useState<ScoreSubmitState>('idle')
  const [isGuest, setIsGuest] = useState<boolean | null>(null)
  const lastRunRef = useRef<{ score: number; wave: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (cancelled) return
        if (res.ok) {
          setIsGuest(false)
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
      {/* In-game top overlay is intentionally minimal: the canvas draws the
          energy bar + score, and the Menu button (in SplitlingsCanvas) owns
          the top-right. Title + Sign in live on the landing page / overlays. */}
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
