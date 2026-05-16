'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import {
  ORB_COLORS,
  SUPERNOVA_RADIUS,
  MIN_SPLIT_RADIUS,
  ENERGY_MAX,
  ENERGY_SPLIT_COST,
  ENERGY_RECHARGE_RATE,
  INITIAL_ORB_COUNT,
  GROWTH_RATE_BASE,
  SPLIT_VELOCITY_BOOST,
  colorIndex,
} from '@/lib/splitlings-engine'
import type { Orb, OrbColor } from '@/lib/splitlings-engine'

interface SplitlingsCanvasProps {
  onGameOver: (score: number, wave: number) => void
  onScoreUpdate: (score: number, combo: number) => void
}

let nextId = 0

function makeOrb(x: number, y: number, r: number, vx: number, vy: number, color: OrbColor): Orb {
  return { id: nextId++, x, y, vx, vy, r, color, pulse: Math.random() * Math.PI * 2, age: 0 }
}

function spawnOrbs(count: number, width: number, height: number): Orb[] {
  const orbs: Orb[] = []
  for (let i = 0; i < count; i++) {
    const color = ORB_COLORS[Math.floor(Math.random() * ORB_COLORS.length)]
    const r = 18 + Math.random() * 22
    const margin = r + 10
    orbs.push(makeOrb(
      margin + Math.random() * (width - 2 * margin),
      margin + Math.random() * (height - 2 * margin),
      r,
      (Math.random() - 0.5) * 1.2,
      (Math.random() - 0.5) * 1.2,
      color,
    ))
  }
  return orbs
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

function drawEnergyBar(ctx: CanvasRenderingContext2D, energy: number, width: number) {
  const barW = Math.min(width - 32, 320)
  const barH = 10
  const bx = (width - barW) / 2
  const by = 16

  // track
  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  ctx.beginPath()
  ctx.roundRect(bx, by, barW, barH, 5)
  ctx.fill()

  // fill
  const pct = energy / ENERGY_MAX
  const energyColor = pct > 0.4
    ? `hsl(160,80%,50%)`
    : pct > 0.2
      ? `hsl(45,90%,55%)`
      : `hsl(0,90%,55%)`

  if (pct > 0) {
    ctx.fillStyle = energyColor
    ctx.beginPath()
    ctx.roundRect(bx, by, barW * pct, barH, 5)
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('ENERGY', bx, by - 3)
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  score: number,
  wave: number,
  combo: number,
  energy: number,
  width: number,
) {
  drawEnergyBar(ctx, energy, width)

  // score top-right
  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = 'bold 22px monospace'
  ctx.fillText(score.toLocaleString(), width - 16, 30)

  ctx.font = '11px sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.fillText(`WAVE ${wave}`, width - 16, 46)

  // combo
  if (combo > 1) {
    ctx.textAlign = 'left'
    ctx.font = `bold ${18 + Math.min(combo * 2, 16)}px sans-serif`
    ctx.fillStyle = `hsl(55,90%,60%)`
    ctx.fillText(`×${combo} COMBO`, 16, 48)
  }
}

export default function SplitlingsCanvas({ onGameOver, onScoreUpdate }: SplitlingsCanvasProps) {
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
    raf: 0,
    waveTimer: 0,
    splashTexts: [] as { x: number; y: number; text: string; alpha: number; vy: number; color: string }[],
  })

  const [overlay, setOverlay] = useState<'menu' | 'gameover' | null>(null)
  const [finalScore, setFinalScore] = useState(0)
  const [finalWave, setFinalWave] = useState(1)

  const triggerGameOver = useCallback(() => {
    const s = stateRef.current
    s.gameOver = true
    setFinalScore(s.score)
    setFinalWave(s.wave)
    setOverlay('gameover')
    cancelAnimationFrame(s.raf)
    onGameOver(s.score, s.wave)
  }, [onGameOver])

  const startGame = useCallback(() => {
    const s = stateRef.current
    const canvas = canvasRef.current
    if (!canvas) return
    s.orbs = spawnOrbs(INITIAL_ORB_COUNT, s.width, s.height)
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
  }, [])

  const handleTap = useCallback((cx: number, cy: number) => {
    const s = stateRef.current
    if (!s.started || s.gameOver || s.paused || s.showMenu) return

    // find the tapped orb (largest first if overlapping)
    const sorted = [...s.orbs].sort((a, b) => b.r - a.r)
    const hit = sorted.find(o => {
      const dx = o.x - cx, dy = o.y - cy
      return Math.sqrt(dx * dx + dy * dy) <= o.r + 8
    })
    if (!hit) return
    if (s.energy < ENERGY_SPLIT_COST) return
    if (hit.r < MIN_SPLIT_RADIUS) return

    s.energy = Math.max(0, s.energy - ENERGY_SPLIT_COST)

    // combo logic
    const ci = colorIndex(hit.color)
    if (s.lastColorIndex === ci) {
      s.combo = Math.min(s.combo + 1, 12)
    } else {
      s.combo = 1
    }
    s.lastColorIndex = ci

    const pointsBase = Math.round(hit.r * 5)
    const points = pointsBase * s.combo
    s.score += points
    onScoreUpdate(s.score, s.combo)

    // splash text
    s.splashTexts.push({
      x: hit.x,
      y: hit.y - hit.r,
      text: s.combo > 1 ? `+${points} ×${s.combo}` : `+${points}`,
      alpha: 1,
      vy: -1.2,
      color: s.combo > 2 ? 'hsl(55,90%,60%)' : 'rgba(255,255,255,0.9)',
    })

    // split the orb
    const newR = hit.r * 0.62
    const angle = Math.atan2(cy - hit.y, cx - hit.x) + Math.PI / 2
    const spd = SPLIT_VELOCITY_BOOST
    const o1 = makeOrb(hit.x, hit.y, newR, Math.cos(angle) * spd, Math.sin(angle) * spd, hit.color)
    const o2 = makeOrb(hit.x, hit.y, newR, -Math.cos(angle) * spd, -Math.sin(angle) * spd, hit.color)

    s.orbs = s.orbs.filter(o => o.id !== hit.id)
    if (newR >= MIN_SPLIT_RADIUS) {
      s.orbs.push(o1, o2)
    }
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
    }

    resize()
    window.addEventListener('resize', resize)

    function loop() {
      if (!ctx) return
      const { width, height } = s

      // background
      ctx.fillStyle = 'hsl(230, 25%, 8%)'
      ctx.fillRect(0, 0, width, height)

      if (!s.started || s.paused || s.showMenu) {
        s.raf = requestAnimationFrame(loop)
        return
      }

      // recharge energy
      s.energy = Math.min(ENERGY_MAX, s.energy + ENERGY_RECHARGE_RATE)

      // wave timer — add new orbs every 15 seconds of surviving
      s.waveTimer++
      if (s.waveTimer >= 60 * 15) {
        s.waveTimer = 0
        s.wave++
        const newCount = Math.min(3, Math.floor(s.wave / 2) + 1)
        if (s.orbs.length + newCount <= 30) {
          s.orbs.push(...spawnOrbs(newCount, width, height))
        }
      }

      // update orbs
      let dead = false
      for (const orb of s.orbs) {
        orb.age++
        orb.pulse += 0.022
        const growthRate = GROWTH_RATE_BASE * (1 + (s.wave - 1) * 0.1)
        orb.r += growthRate
        orb.x += orb.vx
        orb.y += orb.vy

        // bounce off walls
        if (orb.x - orb.r < 0) { orb.x = orb.r; orb.vx = Math.abs(orb.vx) }
        if (orb.x + orb.r > width) { orb.x = width - orb.r; orb.vx = -Math.abs(orb.vx) }
        if (orb.y - orb.r < 0) { orb.y = orb.r; orb.vy = Math.abs(orb.vy) }
        if (orb.y + orb.r > height) { orb.y = height - orb.r; orb.vy = -Math.abs(orb.vy) }

        if (orb.r >= SUPERNOVA_RADIUS) dead = true
      }

      // draw orbs
      for (const orb of s.orbs) {
        drawOrb(ctx, orb)
      }

      // HUD
      drawHUD(ctx, s.score, s.wave, s.combo, s.energy, width)

      // splash texts
      s.splashTexts = s.splashTexts.filter(t => t.alpha > 0)
      for (const t of s.splashTexts) {
        ctx.globalAlpha = t.alpha
        ctx.fillStyle = t.color
        ctx.font = 'bold 16px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(t.text, t.x, t.y)
        t.y += t.vy
        t.alpha -= 0.018
      }
      ctx.globalAlpha = 1

      if (dead) {
        triggerGameOver()
        return
      }

      s.raf = requestAnimationFrame(loop)
    }

    s.raf = requestAnimationFrame(loop)

    // touch/mouse input
    function getPos(e: MouseEvent | TouchEvent) {
      const rect = canvas!.getBoundingClientRect()
      if ('touches' in e) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
      }
      return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top }
    }

    function onDown(e: MouseEvent | TouchEvent) {
      const { x, y } = getPos(e)
      s.holdStart = Date.now()
      s.holdTimer = setTimeout(() => {
        if (s.started && !s.gameOver) {
          s.showMenu = !s.showMenu
          setOverlay(s.showMenu ? 'menu' : null)
        }
      }, 600)
    }

    function onUp(e: MouseEvent | TouchEvent) {
      if (s.holdTimer) {
        clearTimeout(s.holdTimer)
        s.holdTimer = null
      }
      if (Date.now() - s.holdStart < 600) {
        const rect = canvas!.getBoundingClientRect()
        let x: number, y: number
        if ('changedTouches' in e) {
          x = e.changedTouches[0].clientX - rect.left
          y = e.changedTouches[0].clientY - rect.top
        } else {
          x = (e as MouseEvent).clientX - rect.left
          y = (e as MouseEvent).clientY - rect.top
        }
        handleTap(x, y)
      }
    }

    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mouseup', onUp)
    canvas.addEventListener('touchstart', onDown, { passive: true })
    canvas.addEventListener('touchend', onUp, { passive: true })

    return () => {
      cancelAnimationFrame(s.raf)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('touchstart', onDown)
      canvas.removeEventListener('touchend', onUp)
    }
  }, [handleTap, triggerGameOver])

  // Start the game on mount
  useEffect(() => {
    setTimeout(() => {
      const s = stateRef.current
      if (!s.started) {
        startGame()
      }
    }, 100)
  }, [startGame])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 touch-none" />

      {/* Pause/Menu overlay */}
      {overlay === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
          <div className="bg-background/90 border border-border/50 rounded-2xl p-8 w-72 text-center space-y-4">
            <h2 className="text-2xl font-bold text-primary">PAUSED</h2>
            <p className="text-sm text-muted-foreground">Score: {stateRef.current.score.toLocaleString()}</p>
            <button
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
              onClick={() => {
                stateRef.current.showMenu = false
                stateRef.current.paused = false
                setOverlay(null)
              }}
            >
              Resume
            </button>
            <button
              className="w-full py-3 rounded-xl border border-border/50 text-foreground font-medium"
              onClick={() => {
                stateRef.current.showMenu = false
                startGame()
              }}
            >
              New Game
            </button>
            <a
              href="/leaderboard"
              className="block w-full py-3 rounded-xl border border-border/50 text-foreground font-medium"
            >
              Leaderboard
            </a>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {overlay === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10">
          <div className="bg-background/90 border border-border/50 rounded-2xl p-8 w-72 text-center space-y-4">
            <div className="text-5xl font-bold text-destructive animate-pulse">SUPERNOVA!</div>
            <p className="text-muted-foreground text-sm">An orb went supernova</p>
            <div className="py-2">
              <div className="text-4xl font-bold text-primary">{finalScore.toLocaleString()}</div>
              <div className="text-muted-foreground text-sm">Wave {finalWave}</div>
            </div>
            <button
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
              onClick={startGame}
            >
              Play Again
            </button>
            <a
              href="/leaderboard"
              className="block w-full py-3 rounded-xl border border-border/50 text-foreground font-medium"
            >
              Leaderboard
            </a>
          </div>
        </div>
      )}

      {/* Touch hint — shown briefly */}
      {!overlay && (
        <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
          <p className="text-xs text-white/30">Tap orbs to split · Hold anywhere for menu</p>
        </div>
      )}
    </div>
  )
}
