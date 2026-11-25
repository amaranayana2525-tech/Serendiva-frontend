import { expect, test } from '@playwright/test'

// Foundation smoke tests — page authors add their own specs next to this file (submit inquiry, filter tours, lightbox…).

test('home renders the site chrome', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Serendiva — home' }).first()).toBeVisible()
  await expect(page.locator('footer')).toContainText('Private Dispatch Journal')
  await expect(page.locator('main#main-content')).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
})

test('unknown routes show the localised 404 with header and footer', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('footer')).toBeVisible()
})

test('mobile menu opens and closes with the keyboard', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'drawer is only used below xl')
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Open menu' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const drawer = page.getByRole('dialog', { name: 'Menu' })
  await expect(drawer).toBeVisible()
  await expect(drawer.getByRole('link', { name: 'Tours' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('newsletter form validates on the client', async ({ page }) => {
  await page.goto('/')
  const form = page.getByRole('form', { name: 'Newsletter sign-up' })
  await form.getByRole('textbox').fill('not-an-email')
  await form.getByRole('button', { name: 'Join' }).click()
  await expect(form.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
})
