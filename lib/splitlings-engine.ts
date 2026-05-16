// Splitlings game engine types and constants

export interface OrbColor {
  h: number
  s: number
  l: number
}

export interface Orb {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  r: number
  color: OrbColor
  pulse: number
  age: number
}

export interface GameState {
  orbs: Orb[]
  score: number
  wave: number
  energy: number
  combo: number
  lastColorIndex: number | null
  gameOver: boolean
  paused: boolean
  started: boolean
}

export const ORB_COLORS: OrbColor[] = [
  { h: 340, s: 90, l: 60 }, // pink/red
  { h: 25, s: 95, l: 55 },  // orange
  { h: 55, s: 90, l: 55 },  // yellow
  { h: 160, s: 80, l: 50 }, // green
  { h: 210, s: 90, l: 60 }, // blue
  { h: 275, s: 80, l: 65 }, // purple
]

export const SUPERNOVA_RADIUS = 80
export const MIN_SPLIT_RADIUS = 10
export const ENERGY_MAX = 100
export const ENERGY_SPLIT_COST = 8
export const ENERGY_RECHARGE_RATE = 0.12 // per frame
export const INITIAL_ORB_COUNT = 5
export const MAX_ORB_COUNT = 30
export const GROWTH_RATE_BASE = 0.018 // radius per frame
export const SPLIT_VELOCITY_BOOST = 2.5

export function colorIndex(color: OrbColor): number {
  return ORB_COLORS.findIndex(c => c.h === color.h && c.s === color.s && c.l === color.l)
}
