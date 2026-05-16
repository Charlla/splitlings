'use client'

import { useEffect, useRef } from 'react'

const COLORS = [
  { h: 340, s: 90, l: 60 },
  { h: 25, s: 95, l: 55 },
  { h: 55, s: 90, l: 55 },
  { h: 160, s: 80, l: 50 },
  { h: 210, s: 90, l: 60 },
  { h: 275, s: 80, l: 65 },
]

export default function OrbsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let raf = 0

    const orbs = [] as {
      x: number; y: number; r: number
      vx: number; vy: number
      color: typeof COLORS[0]; pulse: number
    }[]

    function resize() {
      const dpr = window.devicePixelRatio || 1
      width = window.innerWidth
      height = window.innerHeight
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      canvas!.style.width = width + 'px'
      canvas!.style.height = height + 'px'
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 12; i++) {
      orbs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 20 + 40 * Math.random(),
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        pulse: Math.random() * Math.PI * 2,
      })
    }

    function draw() {
      ctx!.fillStyle = 'hsl(230, 25%, 8%)'
      ctx!.fillRect(0, 0, width, height)

      for (const orb of orbs) {
        orb.x += orb.vx
        orb.y += orb.vy
        orb.pulse += 0.02

        if (orb.x < -orb.r) orb.x = width + orb.r
        if (orb.x > width + orb.r) orb.x = -orb.r
        if (orb.y < -orb.r) orb.y = height + orb.r
        if (orb.y > height + orb.r) orb.y = -orb.r

        const { h, s, l } = orb.color
        const t = orb.r + 3 * Math.sin(orb.pulse)

        // outer glow
        const glow = ctx!.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, 2 * t)
        glow.addColorStop(0, `hsla(${h},${s}%,${l}%,0.15)`)
        glow.addColorStop(1, 'transparent')
        ctx!.fillStyle = glow
        ctx!.beginPath()
        ctx!.arc(orb.x, orb.y, 2 * t, 0, 2 * Math.PI)
        ctx!.fill()

        // body
        const body = ctx!.createRadialGradient(orb.x - 0.3 * t, orb.y - 0.3 * t, 0, orb.x, orb.y, t)
        body.addColorStop(0, `hsla(${h},${s}%,${l + 20}%,0.8)`)
        body.addColorStop(0.6, `hsla(${h},${s}%,${l}%,0.6)`)
        body.addColorStop(1, `hsla(${h},${s}%,${l - 10}%,0.4)`)
        ctx!.fillStyle = body
        ctx!.beginPath()
        ctx!.arc(orb.x, orb.y, t, 0, 2 * Math.PI)
        ctx!.fill()

        // highlight
        ctx!.fillStyle = `hsla(${h},${Math.max(0, s - 20)}%,${l + 30}%,0.4)`
        ctx!.beginPath()
        ctx!.arc(orb.x - 0.25 * t, orb.y - 0.25 * t, 0.25 * t, 0, 2 * Math.PI)
        ctx!.fill()
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0" />
}
