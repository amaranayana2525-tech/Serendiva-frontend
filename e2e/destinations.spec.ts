import { expect, test } from '@playwright/test'
import { hydrated } from './hydration'

test('filters destinations by search and submits a destination sidebar inquiry', async ({ page }) => {
  await page.goto('/destinations')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const search = page.getByRole('searchbox', { name: 'Search destinations' })
  await hydrated(search)
  const cards = page.locator('main article')
  const total = await cards.count()
  expect(total).toBeGreaterThan(2)

  // Search filters cards live and empty search shows reset control
  await search.fill('no-such-ceylon-place')
  await expect(page.getByRole('heading', { name: 'No destination matches your search' })).toBeVisible()
  await page.getByRole('button', { name: 'Show all destinations' }).click()
  await expect(cards).toHaveCount(total)

  // Navigate to the first destination detail page and submit the inquiry card
  const firstLink = cards.first().getByRole('link').first()
  const href = await firstLink.getAttribute('href')
  const slug = href?.split('/').filter(Boolean).pop() ?? ''
  await firstLink.click()
  await expect(page).toHaveURL(/\/destinations\/[a-z0-9-]+$/, { timeout: 30_000 })

  const sent: Record<string, unknown>[] = []
  await page.route('**/api/v1/inquiries', async (route) => {
    sent.push(JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>)
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ reference: 'SRD-2026-6601', message: 'Thanks' }),
    })
  })

  const form = page.locator('form[aria-label$="— inquiry form"]')
  await hydrated(form.getByRole('button', { name: 'Send Bespoke Inquiry' }))
  await form.getByLabel('Your Full Name').fill('Clara Oswald')
  await form.getByLabel('Private Email Address').fill('clara@example.com')
  await form.getByLabel('WhatsApp / Mobile Contact').fill('+44 7700 900111')
  await form.getByRole('button', { name: 'Send Bespoke Inquiry' }).click()

  await expect(page.getByText('SRD-2026-6601')).toBeVisible()
  expect(sent).toHaveLength(1)
  expect(sent[0]).toMatchObject({
    name: 'Clara Oswald',
    email: 'clara@example.com',
    whatsapp: '+44 7700 900111',
    destinationSlug: slug,
  })
  expect(sent[0].clientRequestId).toMatch(/^[A-Za-z0-9_-]{8,64}$/)
})
