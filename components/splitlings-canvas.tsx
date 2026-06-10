'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PauseOverlay, GameOverScreen, NeonButton } from '@/components/games'
import {
  ORB_COLORS,
  SUPERNOVA_RADIUS,
  START_RADIUS_MIN,
  START_RADIUS_MAX,
  START_SPEED,
  ENERGY_MAX,
  ENERGY_SPLIT_COST,
  ENERGY_RECHARGE_RATE,
  GROWTH_RATE_BASE,
  WAVE_GROWTH_RAMP,
  WAVE_DURATION_FRAMES,
  SPLIT_COUNT,
  SPLIT_RADIUS_FACTOR,
  MIN_FRAGMENT_RADIUS,
  SPLIT_VELOCITY_BOOST,
  EAT_IMMUNITY_FRAMES,
  ABSORB_POINTS_PER_RADIUS,
  absorbedRadius,
  colorIndex,
} from '@/lib/splitlings-engine'
import type { Orb, OrbColor } from '@/lib/splitlings-engine'

export type ScoreSubmitState = 'idle' | 'saving' | 'saved' | 'error'

interface SplitlingsCanvasProps {
  onGameOver: (score: number, wave: number) => void
  onScoreUpdate: (score: number, combo: number) => void
  /** Called when a new round starts (Play Again / New Game). */
  onRestart?: () => void
  isGuest?: boolean
  /** Score submission status, surfaced on the game-over screen. */
  submitState?: ScoreSubmitState
  onRetrySubmit?: () => void
}

let nextId = 0

function makeOrb(x: number, y: number, r: number, vx: number, vy: number, color: OrbColor): Orb {
  return { id: nextId++, x, y, vx, vy, r, color, pulse: Math.random() * Math.PI * 2, age: 0 }
}

/**
 * Start state: exactly ONE orb per color, laid out on a jittered 2×3 grid so
 * they never spawn overlapping. Population only changes through splitting
 * (player) and absorption (same-color eat) — nothing else spawns orbs.
 */
function spawnInitialOrbs(width: number, height: number): Orb[] {
  const cols = 2
  const rows = Math.ceil(ORB_COLORS.length / cols)
  const cellW = width / cols
  const cellH = height / rows
  return ORB_COLORS.map((color, i) => {
    const r = START_RADIUS_MIN + Math.random() * (START_RADIUS_MAX - START_RADIUS_MIN)
    const col = i % cols
    const row = Math.floor(i / cols)
    const jitterX = (Math.random() - 0.5) * (cellW - 2 * (r + 12))
    const jitterY = (Math.random() - 0.5) * (cellH - 2 * (r + 12))
    const angle = Math.random() * Math.PI * 2
    return makeOrb(
      (col + 0.5) * cellW + jitterX,
      (row + 0.5) * cellH + jitterY,
      r,
      Math.cos(angle) * START_SPEED,
      Math.sin(angle) * START_SPEED,
      color,
    )
  })
}

function drawOrb(ctx: CanvasRenderingContext2D, orb: Orb) {
  const { x, y, color, pulse } = orb
  const { h, s, l } = color
  const t = orb.r + 3 * Math.sin(pulse)

  // outer glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, t * 2)
  glow.addColorStop(0, `hsla(${h},${s}%,${l}%,0.15)`)
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(x, y, t * 2, 0, Math.PI * 2)
  ctx.fill()

  // main orb body
  const body = ctx.createRadialGradient(x - 0.3 * t, y - 0.3 * t, 0, x, y, t)
  body.addColorStop(0, `hsla(${h},${s}%,${l + 20}%,0.9)`)
  body.addColorStop(0.6, `hsla(${h},${s}%,${l}%,0.75)`)
  body.addColorStop(1, `hsla(${h},${s}%,${l - 10}%,0.5)`)
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.arc(x, y, t, 0, Math.PI * 2)
  ctx.fill()

  // highlight
  ctx.fillStyle = `hsla(${h},${Math.max(0, s - 20)}%,${l + 30}%,0.45)`
  ctx.beginPath()
  ctx.arc(x - 0.25 * t, y - 0.25 * t, 0.25 * t, 0, Math.PI * 2)
  ctx.fill()

  // supernova warning — pulse red outline when close to limit
  const danger = orb.r / SUPERNOVA_RADIUS
  if (danger > 0.65) {
    const alpha = (danger - 0.65) / 0.35
    const pulse2 = 0.5 + 0.5 * Math.sin(orb.age * 0.15)
    ctx.strokeStyle = `hsla(0,100%,60%,${alpha * pulse2 * 0.9})`
    ctx.lineWidth = 2 + alpha * 3
    ctx.beginPath()
    ctx.arc(x, y, t + 3, 0, Math.PI * 2)
    ctx.stroke()
  }
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  score: number,
  wave: number,
  combo: number,
  energy: number,
  width: number,
  top: number,
) {
  // Single tight strip: energy bar (left) · score (right, clear of the Menu
  // button). No title / sign-in here — those live outside the game screen.
  const barW = Math.min(width * 0.4, 220)
  const barH = 10
  const bx = 16
  const by = top + 14

  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = 'bold 10px monospace'
  ctx.textAlign = 'left'
  ctx.fillText('ENERGY', bx, top + 9)

  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  ctx.beginPath()
  ctx.roundRect(bx, by, barW, barH, 5)
  ctx.fill()

  const pct = energy / ENERGY_MAX
  if (pct > 0) {
    ctx.fillStyle = pct > 0.4
      ? 'hsl(160,80%,50%)'
      : pct > 0.2
        ? 'hsl(45,90%,55%)'
        : 'hsl(0,90%,55%)'
    ctx.beginPath()
    ctx.roundRect(bx, by, barW * pct, barH, 5)
    ctx.fill()
  }

  // score — same strip, right-aligned just left of the Menu button
  // (button is icon-only ≈44px on mobile, "≡ Menu" ≈100px on sm+)
  const scoreRight = width - (width >= 640 ? 128 : 76)
  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = 'bold 22px monospace'
  ctx.fillText(score.toLocaleString(), scoreRight, top + 24)

  ctx.font = '11px monospace'
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.fillText(`WAVE ${wave}`, scoreRight, top + 40)

  // combo — under the energy bar
  if (combo > 1) {
    ctx.textAlign = 'left'
    ctx.font = `bold ${18 + Math.min(combo * 2, 16)}px sans-serif`
    ctx.fillStyle = 'hsl(55,90%,60%)'
    ctx.fillText(`×${combo} COMBO`, 16, by + barH + 28)
  }
}

export default function SplitlingsCanvas({
  onGameOver,
  onScoreUpdate,
  onRestart,
  isGuest = false,
  submitState = 'idle',
  onRetrySubmit,
}: SplitlingsCanvasProps) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    orbs: [] as Orb[],
    score: 0,
    wave: 1,
    energy: ENERGY_MAX,
    combo: 0,
    lastColorIndex: null as number | null,
    gameOver: false,
    paused: false,
    started: false,
    holdTimer: null as ReturnType<typeof setTimeout> | null,
    holdStart: 0,
    showMenu: false,
    width: 0,
    height: 0,
    hudTop: 56,
    raf: 0,
    waveTimer: 0,
    splashTexts: [] as { x: number; y: number; text: string; alpha: number; vy: number; color: string }[],
  })

  const [overlay, setOverlay] = useState<'menu' | 'gameover' | null>(null)
  const [finalScore, setFinalScore] = useState(0)
  const [finalWave, setFinalWave] = useState(1)
  const [pauseStats, setPauseStats] = useState({ score: 0, wave: 1 })

  const openPauseMenu = useCallback(() => {
    const s = stateRef.current
    if (!s.started || s.gameOver || s.showMenu) return
    s.paused = true
    s.showMenu = true
    setPauseStats({ score: s.score, wave: s.wave })
    setOverlay('menu')
  }, [])

  const triggerGameOver = useCallback(() => {
    const s = stateRef.current
    s.gameOver = true
    setFinalScore(s.score)
    setFinalWave(s.wave)
    setOverlay('gameover')
    onGameOver(s.score, s.wave)
  }, [onGameOver])

  const startGame = useCallback(() => {
    const s = stateRef.current
    const canvas = canvasRef.current
    if (!canvas) return
    s.orbs = spawnInitialOrbs(s.width, s.height)
    s.score = 0
    s.wave = 1
    s.energy = ENERGY_MAX
    s.combo = 0
    s.lastColorIndex = null
    s.gameOver = false
    s.paused = false
    s.started = true
    s.showMenu = false
    s.waveTimer = 0
    s.splashTexts = []
    setOverlay(null)
    onScoreUpdate(0, 0)
    onRestart?.()
  }, [onScoreUpdate, onRestart])

  const resumeGame = useCallback(() => {
    const s = stateRef.current
    s.showMenu = false
    s.paused = false
    setOverlay(null)
  }, [])

  const handleTap = useCallback((cx: number, cy: number) => {
    const s = stateRef.current
    if (!s.started || s.gameOver || s.paused || s.showMenu) return

    // MULTI-POP: every orb whose body contains the tap point splits — when
    // orbs overlap, ALL of them pop, not just the topmost. No board cap, no
    // "too crowded" refusal: absorption pulls the population back down.
    const hits = s.orbs
      .filter(o => {
        const dx = o.x - cx, dy = o.y - cy
        return Math.sqrt(dx * dx + dy * dy) <= o.r + 8
      })
      .sort((a, b) => b.r - a.r) // largest first (drives combo color + splash order)
    if (hits.length === 0) return

    // Orbs too small to split silently don't (a color can never be eliminated).
    const splittable = hits.filter(o => o.r * SPLIT_RADIUS_FACTOR >= MIN_FRAGMENT_RADIUS)
    if (splittable.length === 0) {
      // tap hit only too-small orbs — subtle feedback so it never feels dead
      s.splashTexts.push({
        x: cx, y: cy - 20, text: 'TOO SMALL', alpha: 1, vy: -0.8, color: 'rgba(255,255,255,0.7)',
      })
      return
    }
    if (s.energy < ENERGY_SPLIT_COST) {
      // feedback instead of silently swallowing the tap
      s.splashTexts.push({
        x: cx, y: cy - 20, text: 'LOW ENERGY', alpha: 1, vy: -0.8, color: 'hsl(0,90%,60%)',
      })
      return
    }

    // One energy cost per tap, however many orbs pop — multi-pop is the reward.
    s.energy = Math.max(0, s.energy - ENERGY_SPLIT_COST)

    // combo: increments once per tap, chained on the LARGEST popped orb's color
    const ci = colorIndex(splittable[0].color)
    if (s.lastColorIndex === ci) {
      s.combo = Math.min(s.combo + 1, 12)
    } else {
      s.combo = 1
    }
    s.lastColorIndex = ci

    const spd = SPLIT_VELOCITY_BOOST
    const popped = new Set<number>()
    for (const hit of splittable) {
      popped.add(hit.id)
      const newR = hit.r * SPLIT_RADIUS_FACTOR

      // every popped orb scores, all at this tap's combo multiplier
      const points = Math.round(hit.r * 5) * s.combo
      s.score += points
      s.splashTexts.push({
        x: hit.x,
        y: hit.y - hit.r,
        text: s.combo > 1 ? `+${points} ×${s.combo}` : `+${points}`,
        alpha: 1,
        vy: -1.2,
        color: s.combo > 2 ? 'hsl(55,90%,60%)' : 'rgba(255,255,255,0.9)',
      })

      // split into SPLIT_COUNT fragments fanned out from the tap angle.
      // Fragments are eat-immune for a moment (age-based) so they escape
      // before same-color absorption starts pulling them back together.
      const baseAngle = Math.atan2(cy - hit.y, cx - hit.x) + Math.PI / 2
      for (let i = 0; i < SPLIT_COUNT; i++) {
        const a = baseAngle + (i * Math.PI * 2) / SPLIT_COUNT
        s.orbs.push(makeOrb(hit.x, hit.y, newR, Math.cos(a) * spd, Math.sin(a) * spd, hit.color))
      }
    }
    s.orbs = s.orbs.filter(o => !popped.has(o.id))
    onScoreUpdate(s.score, s.combo)
  }, [onScoreUpdate])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const s = stateRef.current

    function resize() {
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      s.width = window.innerWidth
      s.height = window.innerHeight
      canvas.width = s.width * dpr
      canvas.height = s.height * dpr
      canvas.style.width = s.width + 'px'
      canvas.style.height = s.height + 'px'
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // keep the canvas HUD clear of the notch only — the HUD shares one
      // tight strip with the Menu button (no separate nav row anymore)
      const sat = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--safe-top'),
      ) || 0
      s.hudTop = sat + 8
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('orientationchange', resize)

    let last = performance.now()

    function loop(now: number) {
      if (!ctx) return
      const { width, height } = s
      // normalise to 60fps frame units so 120Hz devices don't run 2× speed
      const dt = Math.min(Math.max((now - last) / (1000 / 60), 0), 3)
      last = now

      const running = s.started && !s.paused && !s.showMenu && !s.gameOver

      if (running) {
        // recharge energy
        s.energy = Math.min(ENERGY_MAX, s.energy + ENERGY_RECHARGE_RATE * dt)

        // wave timer — pure difficulty tick (growth speeds up each wave).
        // No orbs are ever spawned: population only changes via splits + eats.
        s.waveTimer += dt
        if (s.waveTimer >= WAVE_DURATION_FRAMES) {
          s.waveTimer = 0
          s.wave++
        }

        // update orbs — everything grows, all the time
        const growthRate = GROWTH_RATE_BASE * (1 + (s.wave - 1) * WAVE_GROWTH_RAMP)
        for (const orb of s.orbs) {
          orb.age += dt
          orb.pulse += 0.022 * dt
          orb.r += growthRate * dt
          orb.x += orb.vx * dt
          orb.y += orb.vy * dt

          // bounce off walls
          if (orb.x - orb.r < 0) { orb.x = orb.r; orb.vx = Math.abs(orb.vx) }
          if (orb.x + orb.r > width) { orb.x = width - orb.r; orb.vx = -Math.abs(orb.vx) }
          if (orb.y - orb.r < 0) { orb.y = orb.r; orb.vy = Math.abs(orb.vy) }
          if (orb.y + orb.r > height) { orb.y = height - orb.r; orb.vy = -Math.abs(orb.vy) }
        }

        // same-color absorption — the larger orb eats the smaller when the
        // smaller's centre is inside it. Mass is conserved (area-additive),
        // so split fragments cascade back into bigger orbs over time.
        // Different colors pass through each other untouched.
        const eaten = new Set<number>()
        for (let i = 0; i < s.orbs.length; i++) {
          const a = s.orbs[i]
          if (eaten.has(a.id)) continue
          for (let j = i + 1; j < s.orbs.length; j++) {
            const b = s.orbs[j]
            if (eaten.has(b.id)) continue
            if (a.color.h !== b.color.h) continue
            const big = a.r >= b.r ? a : b
            const small = big === a ? b : a
            if (small.age < EAT_IMMUNITY_FRAMES) continue
            const dx = a.x - b.x, dy = a.y - b.y
            if (dx * dx + dy * dy >= big.r * big.r) continue

            // eat: area-conserving growth + momentum-weighted velocity blend
            const mBig = big.r * big.r
            const mSmall = small.r * small.r
            big.vx = (big.vx * mBig + small.vx * mSmall) / (mBig + mSmall)
            big.vy = (big.vy * mBig + small.vy * mSmall) / (mBig + mSmall)
            big.r = absorbedRadius(big.r, small.r)
            eaten.add(small.id)

            const points = Math.round(small.r * ABSORB_POINTS_PER_RADIUS)
            s.score += points
            onScoreUpdate(s.score, s.combo)
            s.splashTexts.push({
              x: small.x,
              y: small.y - small.r,
              text: `+${points}`,
              alpha: 1,
              vy: -1,
              color: `hsla(${big.color.h},${big.color.s}%,${Math.min(big.color.l + 15, 80)}%,0.9)`,
            })
            if (eaten.has(a.id)) break
          }
        }
        if (eaten.size > 0) {
          s.orbs = s.orbs.filter(o => !eaten.has(o.id))
        }

        // supernova check after absorption (eating can push an orb over)
        if (s.orbs.some(o => o.r >= SUPERNOVA_RADIUS)) triggerGameOver()
      }

      // draw (always — keeps the frozen scene visible under pause/game-over)
      ctx.fillStyle = 'hsl(230, 25%, 8%)'
      ctx.fillRect(0, 0, width, height)

      for (const orb of s.orbs) {
        drawOrb(ctx, orb)
      }

      if (s.started) {
        drawHUD(ctx, s.score, s.wave, s.combo, s.energy, width, s.hudTop)
      }

      // splash texts
      s.splashTexts = s.splashTexts.filter(t => t.alpha > 0)
      for (const t of s.splashTexts) {
        ctx.globalAlpha = Math.max(0, t.alpha)
        ctx.fillStyle = t.color
        ctx.font = 'bold 16px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(t.text, t.x, t.y)
        if (running) {
          t.y += t.vy * dt
          t.alpha -= 0.018 * dt
        }
      }
      ctx.globalAlpha = 1

      s.raf = requestAnimationFrame(loop)
    }

    s.raf = requestAnimationFrame(loop)

    // Pointer events — unified mouse + touch, no synthetic double-fire
    // (touchend used to be followed by a compat mouseup → double splits).
    function onPointerDown(e: PointerEvent) {
      if (!e.isPrimary) return
      s.holdStart = Date.now()
      if (s.holdTimer) clearTimeout(s.holdTimer)
      s.holdTimer = setTimeout(() => {
        s.holdTimer = null
        openPauseMenu()
      }, 600)
    }

    function onPointerUp(e: PointerEvent) {
      if (!e.isPrimary) return
      if (s.holdTimer) {
        clearTimeout(s.holdTimer)
        s.holdTimer = null
      }
      if (Date.now() - s.holdStart < 600) {
        const rect = canvas!.getBoundingClientRect()
        handleTap(e.clientX - rect.left, e.clientY - rect.top)
      }
    }

    function onPointerCancel() {
      if (s.holdTimer) {
        clearTimeout(s.holdTimer)
        s.holdTimer = null
      }
    }

    // Auto-pause when the tab/app goes to background (calls, app switch)
    function onVisibility() {
      if (document.hidden) openPauseMenu()
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerCancel)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(s.raf)
      if (s.holdTimer) clearTimeout(s.holdTimer)
      window.removeEventListener('resize', resize)
      window.removeEventListener('orientationchange', resize)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerCancel)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [handleTap, triggerGameOver, openPauseMenu, onScoreUpdate])

  // Start the game on mount
  useEffect(() => {
    const id = setTimeout(() => {
      const s = stateRef.current
      if (!s.started) {
        startGame()
      }
    }, 100)
    return () => clearTimeout(id)
  }, [startGame])


  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        role="img"
        aria-label="Splitlings game arena — tap orbs to split them"
      />

      {/* Always-visible MENU button — pauses + opens overlay. ≥44px touch target. */}
      {!overlay && (
        <button
          type="button"
          onClick={openPauseMenu}
          aria-label="Pause and open menu"
          className="absolute right-3 z-10 inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-game-md border border-game-border-strong bg-game-surface/85 px-3 font-mono text-[11px] font-bold uppercase tracking-[3px] text-game-ink backdrop-blur-sm hover:border-game-accent/60 sm:px-4"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 6px)' }}
        >
          <span aria-hidden="true" className="text-sm leading-none">≡</span>
          <span className="hidden sm:inline">Menu</span>
        </button>
      )}

      {/* Pause/Menu overlay — games DS */}
      <PauseOverlay
        open={overlay === 'menu'}
        title="PAUSED"
        onResume={resumeGame}
        onRestart={startGame}
        onQuit={() => router.push('/')}
        extra={
          <>
            <p className="text-center font-mono text-sm text-game-ink-muted">
              Score{' '}
              <span className="font-bold text-game-accent">
                {pauseStats.score.toLocaleString()}
              </span>{' '}
              · Wave {pauseStats.wave}
            </p>
            <NeonButton
              variant="ghost"
              size="md"
              fullWidth
              onClick={() => router.push('/leaderboard')}
            >
              Leaderboard
            </NeonButton>
          </>
        }
      />

      {/* Game over overlay — games DS */}
      <GameOverScreen
        open={overlay === 'gameover'}
        title="SUPERNOVA"
        subtitle="An orb hit critical mass"
        stats={[
          { label: 'Score', value: finalScore.toLocaleString(), tone: 'accent' },
          { label: 'Wave', value: finalWave, tone: 'accent-2' },
        ]}
        onReplay={startGame}
        replayLabel="Play Again"
        onSubmit={!isGuest && submitState === 'error' ? onRetrySubmit : undefined}
        submitLabel="Retry save"
        submitting={submitState === 'saving'}
        onQuit={() => router.push('/leaderboard')}
        quitLabel="Leaderboard"
        extra={
          isGuest ? (
            <a
              href="/auth/login?next=/game"
              data-testid="signin-to-submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-game-pill border border-game-accent/40 px-4 text-center text-sm font-medium text-game-accent hover:border-game-accent"
            >
              Sign in to save your score →
            </a>
          ) : submitState === 'saving' ? (
            <p className="text-center font-mono text-xs uppercase tracking-[2px] text-game-ink-muted" aria-live="polite">
              Saving score…
            </p>
          ) : submitState === 'saved' ? (
            <p className="text-center font-mono text-xs uppercase tracking-[2px] text-game-success" aria-live="polite">
              Score saved to leaderboard
            </p>
          ) : submitState === 'error' ? (
            <p className="text-center font-mono text-xs uppercase tracking-[2px] text-game-danger" aria-live="polite">
              Could not save score
            </p>
          ) : null
        }
      />

      {/* Touch hint */}
      {!overlay && (
        <div
          className="pointer-events-none absolute left-0 right-0 text-center"
          style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <p className="text-xs text-white/30">Tap to split · Same colors merge · Hold for menu</p>
        </div>
      )}
    </div>
  )
}
