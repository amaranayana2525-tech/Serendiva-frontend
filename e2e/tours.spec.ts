import { expect, test, type Page } from '@playwright/test'

// /tours filters (URL-synced) and the tour-detail lightbox. Uses the seeded catalogue (see PAGES_BRIEF.md).

const resultCount = (page: Page) => page.locator('p[aria-live="polite"]').filter({ hasText: /Showing/ })

/** Interactive tour widgets set `data-hydrated` once React has hydrated them (clicks before that are lost). */
const hydrated = (page: Page, selector: string) => expect(page.locator(`${selector}[data-hydrated]`)).toBeAttached()

test('filters tours by category, duration and search — and keeps them in the URL', async ({ page }) => {
  await page.goto('/tours')
  await expect(page.getByRole('heading', { level: 1, name: 'Tours Designed Around You' })).toBeVisible()
  await hydrated(page, 'div')
  const cards = page.locator('main article')
  const total = await cards.count()
  expect(total).toBeGreaterThan(3)

  await page.getByRole('button', { name: /^Wildlife & Safari/ }).click()
  await expect(page).toHaveURL(/[?&]category=wildlife-safari/)
  await expect(page.getByRole('button', { name: /^Wildlife & Safari/ })).toHaveAttribute('aria-pressed', 'true')
  const wildlife = await cards.count()
  expect(wildlife).toBeGreaterThan(0)
  expect(wildlife).toBeLessThan(total)
  await expect(resultCount(page)).toContainText(String(wildlife))

  await page.getByLabel('Duration:').selectOption('8-11')
  await expect(page).toHaveURL(/duration=8-11/)
  await expect(cards.first()).toContainText(/Nights/)

  await page.getByRole('searchbox', { name: 'Search tours' }).fill('untamed')
  await expect(page).toHaveURL(/q=untamed/)
  await expect(cards).toHaveCount(1)
  await expect(cards.first()).toContainText('Wild Leopards')

  // A shared link restores the same state.
  await page.goto('/tours?category=wildlife-safari&duration=8-11&q=untamed')
  await hydrated(page, 'div')
  await expect(cards).toHaveCount(1)
  await expect(page.getByLabel('Duration:')).toHaveValue('8-11')

  // No results → empty state with a working reset.
  await page.getByRole('searchbox', { name: 'Search tours' }).fill('no-such-journey')
  await expect(page.getByRole('heading', { name: /No journey matches/ })).toBeVisible()
  await page.getByRole('button', { name: 'Reset filters' }).click()
  await expect(page).toHaveURL(/\/tours$/)
  await expect(cards).toHaveCount(total)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
})

test('filters survive opening a tour and coming back', async ({ page }) => {
  await page.goto('/tours?category=hill-country&duration=4-7')
  await hydrated(page, 'div')
  const cards = page.locator('main article')
  await expect(cards).toHaveCount(1)
  await cards.first().getByRole('link').first().click()
  await expect(page).toHaveURL(/\/tours\/[a-z0-9-]+$/, { timeout: 30_000 })
  await page.goBack()
  await expect(page).toHaveURL(/\/tours\?category=hill-country&duration=4-7$/)
  await expect(page.getByLabel('Duration:')).toHaveValue('4-7')
  await expect(page.getByRole('button', { name: /^Hill Country/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(cards).toHaveCount(1)
})

test('tour gallery opens an accessible lightbox with keyboard navigation', async ({ page }) => {
  await page.goto('/tours/cultural-odyssey')
  await expect(page.getByRole('heading', { level: 1, name: 'The Cultural Odyssey' })).toBeVisible()
  await hydrated(page, 'div')

  const trigger = page.getByRole('button', { name: /View All \d+ Expedition Photos/ })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Image viewer' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText(/1 \/ \d+/)

  await page.keyboard.press('ArrowRight')
  await expect(dialog).toContainText(/2 \/ \d+/)
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await expect(dialog).toContainText(/(\d+) \/ \1/) // wrapped to the last photo

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('itinerary days expand and collapse', async ({ page }) => {
  await page.goto('/tours/cultural-odyssey')
  await hydrated(page, '#itinerary')
  const firstDay = page.getByRole('button', { name: /^Day 01/ })
  await expect(firstDay).toHaveAttribute('aria-expanded', 'false')
  await firstDay.click()
  await expect(firstDay).toHaveAttribute('aria-expanded', 'true')
  await page.getByRole('button', { name: /Expand All \d+ Days/ }).click()
  await expect(page.getByRole('button', { name: /^Day \d+/, expanded: false })).toHaveCount(0)
  await page.getByRole('button', { name: 'Collapse All Days' }).click()
  await expect(page.getByRole('button', { name: /^Day \d+/, expanded: true })).toHaveCount(0)
})
