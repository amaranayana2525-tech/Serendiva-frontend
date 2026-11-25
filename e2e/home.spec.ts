import { expect, test } from '@playwright/test'
import { hydrated } from './hydration'

// Home hero quick-inquiry bar → /contact pre-filled (party, interest, exact travel window).

test('hero quick-inquiry bar opens a pre-filled inquiry', async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.clear())
  await page.goto('/')
  const bar = page.locator('form').filter({ has: page.getByRole('button', { name: /Get My Plan/i }) })
  const selects = bar.locator('select')
  await expect(selects).toHaveCount(3)
  await hydrated(bar.getByRole('button', { name: /Get My Plan/i }))

  await selects.nth(0).selectOption('wildlife-safari')
  // Second travel window: its value is the whole month range ('YYYY-MM/YYYY-MM') so /contact shows exactly it.
  const windowValue = await selects.nth(1).locator('option').nth(1).getAttribute('value')
  expect(windowValue).toMatch(/^\d{4}-\d{2}\/\d{4}-\d{2}$/)
  await selects.nth(1).selectOption(windowValue!)
  await selects.nth(2).selectOption('family')
  await bar.getByRole('button', { name: /Get My Plan/i }).click()

  await expect(page).toHaveURL(/\/contact\?/, { timeout: 30_000 })
  const url = new URL(page.url())
  expect(url.searchParams.get('interests')).toBe('wildlife-safari')
  expect(url.searchParams.get('month')).toBe(windowValue)
  expect(url.searchParams.get('party')).toBe('family')
  expect(url.searchParams.has('adults')).toBe(false) // no invented head count
  expect(url.searchParams.get('source')).toBe('home-hero')

  const wizard = page.getByRole('form', { name: 'Bespoke trip inquiry' })
  await expect(wizard.locator('input[name=partyType][value=family]')).toBeChecked()
  await page.getByRole('button', { name: 'Continue to Dates & Pace' }).click()
  // The travel-window select shows exactly the chosen range: "<first month> – <last month> <year>".
  const monthName = (iso: string) => {
    const [year, month] = iso.split('-').map(Number)
    return new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(year!, month! - 1, 1)))
  }
  const [from, to] = windowValue!.split('/') as [string, string]
  const selected = (await wizard.locator('select[name=travelWindow] option:checked').textContent()) ?? ''
  expect(selected).toContain(monthName(from))
  expect(selected).toContain(monthName(to))
  await page.getByRole('button', { name: 'Continue to Passions & Stays' }).click()
  await expect(wizard.locator('input[name=interests]:checked')).toHaveCount(1)
})
