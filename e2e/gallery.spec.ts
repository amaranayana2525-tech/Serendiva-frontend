import { expect, test, type Page } from '@playwright/test'
import { hydrated } from './hydration'

// Gallery: URL-synced category chips, editorial grid and the accessible lightbox (←/→/Esc, counter, focus restore).

const counter = (page: Page) => page.getByRole('dialog').getByText(/^\d+ \/ \d+$/)

test('lightbox opens from a plate and is keyboard navigable', async ({ page }) => {
  await page.goto('/gallery')
  const plates = page.getByRole('button', { name: /in the image viewer/ })
  // The interactive grid replaces the static fallback after hydration (it reads ?category= on the client).
  await expect(plates.first()).toBeVisible({ timeout: 30_000 })
  const total = await plates.count()
  expect(total).toBeGreaterThan(2)

  const first = plates.first()
  const dialog = page.getByRole('dialog', { name: 'Gallery viewer' })
  // A key press before hydration is lost (the dev server may still be compiling): retry until the viewer opens.
  await expect(async () => {
    await first.focus()
    await page.keyboard.press('Enter')
    await expect(dialog).toBeVisible({ timeout: 1_000 })
  }).toPass({ timeout: 30_000 })
  await expect(counter(page)).toHaveText(`1 / ${total}`)
  // Focus moves into the dialog (close button).
  await expect(dialog.getByRole('button', { name: 'Close image viewer' })).toBeFocused()

  await page.keyboard.press('ArrowRight')
  await expect(counter(page)).toHaveText(`2 / ${total}`)
  await page.keyboard.press('ArrowRight')
  await expect(counter(page)).toHaveText(`3 / ${total}`)
  await page.keyboard.press('ArrowLeft')
  await expect(counter(page)).toHaveText(`2 / ${total}`)
  // Wraps around backwards from the first image.
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await expect(counter(page)).toHaveText(`${total} / ${total}`)

  // Caption shows the title and the location.
  await expect(dialog.locator('figcaption')).not.toBeEmpty()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  // Focus returns to the plate that opened the viewer.
  await expect(first).toBeFocused()
})

test('category chips filter the grid and sync with the URL', async ({ page }) => {
  await page.goto('/gallery')
  const plates = page.getByRole('button', { name: /in the image viewer/ })
  await expect(plates.first()).toBeVisible({ timeout: 30_000 })
  const all = await plates.count()

  const chip = page.getByRole('button', { name: /Wildlife & Sanctuaries/ })
  await hydrated(chip)
  await chip.click()
  await expect(chip).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/[?&]category=wildlife\b/)
  const filtered = await plates.count()
  expect(filtered).toBeGreaterThan(0)
  expect(filtered).toBeLessThan(all)

  // A direct link restores the filter.
  await page.goto('/gallery?category=wildlife')
  await expect(page.getByRole('button', { name: /Wildlife & Sanctuaries/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(plates).toHaveCount(filtered)

  await page.getByRole('button', { name: /All Archives/ }).click()
  await expect(page).not.toHaveURL(/category=/)
  await expect(plates).toHaveCount(all)
})

test('film cards open the lite video player only on demand', async ({ page }) => {
  await page.goto('/gallery')
  await expect(page.locator('iframe[src*="youtube"]')).toHaveCount(0)
  const play = page.getByRole('button', { name: /^Play film:/ }).first()
  await hydrated(play)
  await play.click()
  const dialog = page.getByRole('dialog', { name: 'Video player' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('iframe[src*="youtube-nocookie.com/embed/"]')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.locator('iframe[src*="youtube"]')).toHaveCount(0)
})
