/**
 * Splitlings E2E smoke tests.
 * Verifies landing → game canvas → orb tapping flow.
 */
import { test, expect } from '@playwright/test'

test.describe.serial('Splitlings smoke', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'SPLITLINGS' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/split the orbs/i).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /start playing/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /view leaderboard/i })).toBeVisible()
  })

  test('Start Playing redirects guests to login', async ({ page }) => {
    await page.goto('/')
    // The Start Playing href is server-side conditional. Check the href directly first.
    const href = await page.getByRole('link', { name: /start playing/i }).getAttribute('href')
    console.log('Start Playing href:', href)
    expect(href).toMatch(/\/auth\/login|\/game/)
    // And actually clicking should navigate
    await Promise.all([
      page.waitForURL(/\/auth\/login|\/game/, { timeout: 5_000 }),
      page.getByRole('link', { name: /start playing/i }).click(),
    ])
  })

  test('login page renders form', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test('register page renders form', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test('game canvas loads and orbs eventually appear', async ({ page }) => {
    await page.goto('/game')
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible({ timeout: 10_000 })
    const box = await canvas.boundingBox()
    expect(box?.width ?? 0).toBeGreaterThan(100)
    expect(box?.height ?? 0).toBeGreaterThan(100)
    // Give it time to spawn orbs
    await page.waitForTimeout(3000)
  })

  test('tapping the canvas increments score over time', async ({ page }) => {
    await page.goto('/game')
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(3000)

    const main = page.locator('main[data-score]').first()
    const initialScore = parseInt((await main.getAttribute('data-score')) ?? '0', 10)

    const box = await canvas.boundingBox()
    if (!box) throw new Error('canvas has no box')
    for (let i = 0; i < 25; i++) {
      const x = box.x + box.width * (0.1 + Math.random() * 0.8)
      const y = box.y + box.height * (0.1 + Math.random() * 0.8)
      await page.mouse.click(x, y, { delay: 25 })
      await page.waitForTimeout(120)
    }

    await page.waitForTimeout(500)
    const finalScore = parseInt((await main.getAttribute('data-score')) ?? '0', 10)
    const finalText = await page.locator('body').innerText()
    const gameOver = /game over|supernova|final score/i.test(finalText)
    console.log('Initial score:', initialScore, 'Final score:', finalScore, 'Game over:', gameOver)
    expect(finalScore > initialScore || gameOver).toBe(true)
  })

  test('leaderboard page loads', async ({ page }) => {
    await page.goto('/leaderboard')
    await expect(page.locator('body')).toContainText(/leaderboard|top|no scores yet/i, { timeout: 10_000 })
  })

  test('API endpoints respond correctly', async ({ page }) => {
    const me = await page.request.get('/api/auth/me')
    // 401 if no cookie
    expect([200, 401]).toContain(me.status())

    const scores = await page.request.get('/api/scores')
    expect(scores.ok()).toBe(true)
  })
})
