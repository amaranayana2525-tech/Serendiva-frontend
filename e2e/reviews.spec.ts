import { expect, test, type Page } from '@playwright/test'

// Reviews: URL-synced filters (traveller type, route, guest origin), load more, and the share-your-experience form.

const cards = (page: Page) =>
  page
    .locator('section', { has: page.getByRole('heading', { name: 'Voices of Bespoke Ceylon' }) })
    .locator('ul > li article')

test('traveller type, origin and route filters are URL-synced', async ({ page }) => {
  await page.goto('/reviews')
  await expect(page.getByRole('heading', { name: 'Seasonal Guest Spotlight' })).toBeVisible()
  await expect(cards(page)).toHaveCount(6)

  const families = page.getByRole('button', { name: /Families with Children/ })
  await families.click()
  await expect(families).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/[?&]type=family\b/)
  // The editorial spotlight steps aside while a filter is active.
  await expect(page.getByRole('heading', { name: 'Seasonal Guest Spotlight' })).toBeHidden()
  const familyCount = await cards(page).count()
  expect(familyCount).toBeGreaterThan(0)

  await page.getByLabel('Guest Origin:').selectOption('uk')
  await expect(page).toHaveURL(/origin=uk/)
  for (const meta of await cards(page).locator('h3 + span').allTextContents()) {
    expect(meta).toMatch(/United Kingdom|Ireland/)
  }

  // Deep link restores every filter.
  await page.goto('/reviews?type=couple&origin=se')
  await expect(page.getByRole('button', { name: /Couples & Honeymoon/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByLabel('Guest Origin:')).toHaveValue('se')

  await page.getByRole('button', { name: 'Reset filters' }).first().click()
  await expect(page).not.toHaveURL(/type=|origin=|tour=/)
})

test('load more reveals the next reflections and moves focus to them', async ({ page }) => {
  await page.goto('/reviews')
  await expect(cards(page)).toHaveCount(6)
  await page.getByRole('button', { name: /^Load Next \d+ Reflections$/ }).click()
  await expect(cards(page)).toHaveCount(12)
  await expect(page.locator('li:focus')).toHaveCount(1)
  await page.getByRole('button', { name: /^Browse All \d+ Diaries$/ }).click()
  await expect(page.getByText('You are reading every published reflection.')).toBeVisible()
})

test('share form validates, then submits (API mocked)', async ({ page }) => {
  await page.route('**/api/v1/reviews', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    const body = route.request().postDataJSON() as Record<string, unknown>
    expect(body).toMatchObject({ guestName: 'Test Guest', country: 'GB', rating: 4, travellerType: 'couple' })
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ message: 'Thanks' }) })
  })
  await page.goto('/reviews/share')
  const form = page.getByRole('form', { name: 'Your review' })
  await form.getByRole('button', { name: 'Submit My Review' }).click()
  await expect(form.getByLabel(/Your name/)).toHaveAttribute('aria-invalid', 'true')
  await expect(form.getByText('Please choose a rating from 1 to 5.')).toBeVisible()

  await form.getByLabel(/Your name/).fill('Test Guest')
  await form.getByLabel(/Email address/).fill('guest@example.com')
  await form.getByLabel(/Country of residence/).selectOption('GB')
  await form.getByLabel(/You travelled as/).selectOption('couple')
  await form.getByRole('radio', { name: /^4 stars/ }).check({ force: true })
  await form.getByLabel(/Your experience/).fill('A wonderful, unhurried journey with a thoughtful guide.')
  await form.getByRole('button', { name: 'Submit My Review' }).click()
  await expect(page.getByRole('heading', { name: /your review has reached me/ })).toBeVisible()
})

test('share form explains rate limiting', async ({ page }) => {
  await page.route('**/api/v1/reviews', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({
          status: 429,
          headers: { 'retry-after': '30' },
          contentType: 'application/json',
          body: JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } }),
        })
      : route.fallback(),
  )
  await page.goto('/reviews/share')
  const form = page.getByRole('form', { name: 'Your review' })
  await form.getByLabel(/Your name/).fill('Test Guest')
  await form.getByLabel(/Email address/).fill('guest@example.com')
  await form.getByLabel(/Country of residence/).selectOption('DE')
  await form.getByLabel(/You travelled as/).selectOption('solo')
  await form.getByRole('radio', { name: /^5 stars/ }).check({ force: true })
  await form.getByLabel(/Your experience/).fill('Twenty-plus characters of honest feedback.')
  await form.getByRole('button', { name: 'Submit My Review' }).click()
  await expect(form.getByRole('alert')).toContainText('Too many requests')
})
