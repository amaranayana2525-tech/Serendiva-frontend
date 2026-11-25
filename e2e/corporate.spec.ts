import { expect, test, type Page } from '@playwright/test'
import { hydrated } from './hydration'

/*
 * /corporate RFP form: client-side attachment checks (size/type) and a multipart submission with a small PDF.
 * The API is intercepted (the shared API rate-limits forms to 5/min per IP); real submissions were verified manually.
 */

const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n')

const form = (page: Page) => page.getByRole('form', { name: 'Corporate proposal request' })

async function fillRequired(page: Page) {
  const f = form(page)
  await f.locator('[name=company]').fill('Acme Leadership Forum')
  await f.locator('[name=contactPerson]').fill('Ada Lovelace, Head of Events')
  await f.locator('[name=email]').fill('ada@acme.example')
  await f.locator('[name=phone]').fill('+41 22 555 0192')
  await f.locator('[name=groupSize]').selectOption({ index: 1 })
  await f.locator('[name=dates]').fill('November 2027 (6 days)')
  await f.locator('[name=eventType]').selectOption({ index: 1 })
}

test('rejects oversized and wrong-type attachments on the client', async ({ page }) => {
  await page.goto('/corporate')
  const file = form(page).locator('input[type=file]')
  await hydrated(file)

  await file.setInputFiles({
    name: 'huge.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1, 65),
  })
  await expect(form(page).getByRole('alert')).toContainText('larger than 5 MB')
  await expect(file).toHaveAttribute('aria-invalid', 'true')

  await file.setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') })
  await expect(form(page).getByRole('alert')).toContainText('PDF or DOCX')

  await file.setInputFiles({ name: 'brief.pdf', mimeType: 'application/pdf', buffer: PDF })
  await expect(form(page).getByRole('alert')).toHaveCount(0)
  await expect(form(page)).toContainText('brief.pdf')
})

test('submits the proposal as multipart with the PDF and shows the reference', async ({ page }) => {
  let body = ''
  let contentType = ''
  await page.route('**/api/v1/corporate-proposals', async (route) => {
    body = route.request().postDataBuffer()?.toString('latin1') ?? ''
    contentType = (await route.request().headerValue('content-type')) ?? ''
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ reference: 'SRD-C-2026-0042', message: 'Thank you' }),
    })
  })
  await page.goto('/corporate')

  // Client validation first: nothing is sent.
  await hydrated(form(page).getByRole('button', { name: 'Request Bespoke Corporate Proposal' }))
  await form(page).getByRole('button', { name: 'Request Bespoke Corporate Proposal' }).click()
  await expect(form(page).locator('[name=company]')).toHaveAttribute('aria-invalid', 'true')
  expect(body).toBe('')

  await fillRequired(page)
  await form(page).locator('input[type=checkbox]').first().check()
  await form(page)
    .locator('input[type=file]')
    .setInputFiles({ name: 'brief.pdf', mimeType: 'application/pdf', buffer: PDF })
  await form(page).getByRole('button', { name: 'Request Bespoke Corporate Proposal' }).click()

  await expect(page.getByTestId('proposal-reference')).toHaveText('SRD-C-2026-0042')
  expect(contentType).toMatch(/^multipart\/form-data; boundary=/)
  expect(body).toContain('name="company"')
  expect(body).toContain('Acme Leadership Forum')
  expect(body).toContain('name="logistics"')
  expect(body).toMatch(/name="attachment"; filename="brief\.pdf"/)
  expect(body).toContain('%PDF-1.4')
  expect(body).toContain('name="locale"')
  expect(body).toContain('name="clientRequestId"')
})
