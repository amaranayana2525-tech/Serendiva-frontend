import { expect, test, type Page } from '@playwright/test'
import { hydrated } from './hydration'

/*
 * Newsletter double opt-in: footer sign-up → confirmation link → /newsletter/confirm → /newsletter/unsubscribe.
 * The API is intercepted (rate limits + no real emails); the real flow (email preview in serendiva-api/tmp/emails)
 * was verified manually against the dev API.
 */

const cors = { 'access-control-allow-origin': '*' }

async function mockTokenEndpoint(page: Page, action: 'confirm' | 'unsubscribe', status: number, body: unknown) {
  const tokens: string[] = []
  await page.route(`**/api/v1/newsletter/${action}?*`, async (route) => {
    tokens.push(new URL(route.request().url()).searchParams.get('token') ?? '')
    await route.fulfill({ status, contentType: 'application/json', headers: cors, body: JSON.stringify(body) })
  })
  return tokens
}

test('footer sign-up sends the email + locale and asks the visitor to confirm', async ({ page }) => {
  const bodies: Record<string, unknown>[] = []
  await page.route('**/api/v1/newsletter/subscribe', async (route) => {
    bodies.push(route.request().postDataJSON() as Record<string, unknown>)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: cors,
      body: JSON.stringify({ status: 'pending', message: 'Check your inbox' }),
    })
  })
  await page.goto('/about')
  const form = page.locator('footer').getByRole('form', { name: 'Newsletter sign-up' })
  await hydrated(form.getByRole('button', { name: 'Join' }))
  await form.getByRole('textbox').fill('reader@example.com')
  await form.getByRole('button', { name: 'Join' }).click()
  await expect(form).toContainText('please confirm your subscription')
  await expect(form.getByRole('textbox')).toHaveValue('')
  expect(bodies).toHaveLength(1)
  expect(bodies[0]).toMatchObject({ email: 'reader@example.com', locale: 'en', source: 'footer' })
})

test('confirmation link confirms the subscription and leads on to an inquiry', async ({ page }) => {
  const tokens = await mockTokenEndpoint(page, 'confirm', 200, { status: 'confirmed' })
  await page.goto('/newsletter/confirm?token=tok_confirm_1234567890')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome to the Private Dispatch Journal')
  expect(tokens).toEqual(['tok_confirm_1234567890'])
  await expect(page.getByRole('link', { name: 'Plan My Trip' }).first()).toHaveAttribute('href', /\/contact/)
})

test('an expired confirmation link offers a fresh sign-up', async ({ page }) => {
  await mockTokenEndpoint(page, 'confirm', 400, { error: { code: 'INVALID_TOKEN', message: 'Invalid token' } })
  await page.goto('/newsletter/confirm?token=expired')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/invalid|expired/i)
  await expect(page.getByRole('main').getByRole('form')).toBeVisible()
})

test('unsubscribe link unsubscribes', async ({ page }) => {
  const tokens = await mockTokenEndpoint(page, 'unsubscribe', 200, { status: 'unsubscribed' })
  await page.goto('/newsletter/unsubscribe?token=tok_unsub_4567890123')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('You have been unsubscribed')
  expect(tokens).toEqual(['tok_unsub_4567890123'])
})
