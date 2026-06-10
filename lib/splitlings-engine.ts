// Splitlings game engine types and constants
//
// Core loop (original design, restored 2026-06-10):
//   1. Every orb GROWS steadily over time — all orbs, all the time.
//   2. Same-color collision: the LARGER orb EATS the smaller one and absorbs
//      its mass (area-conserving: r = sqrt(rL² + rS²)).
//   3. Tapping SPLITS every orb under the tap point into fragments (multi-pop
//      when orbs overlap). Fragments keep growing, and
//      same-color absorption cascades them back into bigger orbs — no new
//      orbs are ever spawned into the game.
//   4. The board starts with exactly ONE orb of each color. Population only
//      changes through splitting (player action) and absorption (eat).
//   Different-color orbs drift through each other (no collision).
//   Game over: any orb reaches SUPERNOVA_RADIUS.
//
// All per-frame values assume 60fps frame units (the loop normalises dt).

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

// ── Start state — exactly one orb per color ─────────────────────────────
export const START_RADIUS_MIN = 16
export const START_RADIUS_MAX = 22
export const START_SPEED = 0.9 // px/frame drift

// ── Growth ──────────────────────────────────────────────────────────────
export const GROWTH_RATE_BASE = 0.018  // radius px/frame (~1.1 px/s at wave 1)
export const WAVE_GROWTH_RAMP = 0.12   // +12% growth per wave survived
export const WAVE_DURATION_FRAMES = 60 * 15 // a "wave" = 15s survived (difficulty tick only — spawns nothing)

// ── Splitting (tap) ─────────────────────────────────────────────────────
// A tap splits EVERY orb whose body contains the tap point (overlapping orbs
// all pop — multi-pop). One tap = one energy cost regardless of how many pop.
// There is no board cap: energy throttles tap rate and MIN_FRAGMENT_RADIUS
// bounds how far things can be split, and absorption pulls the count back
// down, so the population self-regulates without ever refusing a tap.
export const SPLIT_COUNT = 3           // fragments per popped orb
export const SPLIT_RADIUS_FACTOR = 0.5 // fragment r = 0.5r → ~25% of area vented per split
export const MIN_FRAGMENT_RADIUS = 9   // orbs whose fragments would be smaller silently don't split (a color can never vanish)
export const SPLIT_VELOCITY_BOOST = 2.5

// ── Absorption (same-color eat) ─────────────────────────────────────────
// The larger orb eats the smaller when the smaller's centre is inside it.
export const EAT_IMMUNITY_FRAMES = 50      // fresh fragments can't be eaten for ~0.8s (lets a split actually escape)
export const ABSORB_POINTS_PER_RADIUS = 4  // passive cascade points = round(rSmall × this)

/** Area-conserving absorption: the eater's new radius. */
export function absorbedRadius(rLarge: number, rSmall: number): number {
  return Math.sqrt(rLarge * rLarge + rSmall * rSmall)
}

// ── Energy ──────────────────────────────────────────────────────────────
export const ENERGY_MAX = 100
export const ENERGY_SPLIT_COST = 8
export const ENERGY_RECHARGE_RATE = 0.12 // per frame

// ── Death ───────────────────────────────────────────────────────────────
export const SUPERNOVA_RADIUS = 80

export function colorIndex(color: OrbColor): number {
  return ORB_COLORS.findIndex(c => c.h === color.h && c.s === color.s && c.l === color.l)
}
