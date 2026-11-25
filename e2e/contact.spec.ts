import { expect, test, type Page } from '@playwright/test'

/*
 * /contact "Plan My Trip" wizard. The API call is intercepted (the shared API rate-limits forms to 5/min per IP),
 * so these tests check exactly what the browser sends and how the UI reacts.
 * Real submissions against the API were verified manually (see the page author's report).
 */

interface InquiryRequest {
  name: string
  email: string
  whatsapp?: string
  partyType?: string
  adults: number
  children: number
  travelWindow?: string
  travelStart?: string
  travelEnd?: string
  flexibleDates?: boolean
  message?: string
  interests: string[]
  tourSlug?: string
  destinationSlug?: string
  sourcePage?: string
  locale: string
  clientRequestId?: string
}

async function mockInquiryApi(
  page: Page,
  status = 201,
  body: unknown = { reference: 'SRD-2026-4242', message: 'Thanks' },
) {
  const requests: InquiryRequest[] = []
  await page.route('**/api/v1/inquiries', async (route) => {
    requests.push(JSON.parse(route.request().postData() ?? '{}') as InquiryRequest)
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': '*',
        'access-control-expose-headers': 'retry-after',
        ...(status === 429 ? { 'retry-after': '42' } : {}),
      },
      body: JSON.stringify(body),
    })
  })
  return requests
}

const wizard = (page: Page) => page.getByRole('form', { name: 'Bespoke trip inquiry' })

async function fillDetails(page: Page) {
  const form = wizard(page)
  await form.getByLabel('Full Name').fill('Ada Lovelace')
  await form.getByLabel('Email Address').fill('ada@example.com')
  await form.getByLabel('Country calling code').selectOption('+44')
  await form.getByLabel('WhatsApp / Mobile Number').fill('7700 900123')
  await form.getByLabel('Country of Residence').fill('United Kingdom')
}

/** Steps 1–3 with the minimum a visitor must choose (party, travel window); everything else stays "no preference". */
async function chooseBasics(page: Page) {
  await page.getByText('Couple / Romantic').click()
  await page.getByRole('button', { name: 'Continue to Dates & Pace' }).click()
  await wizard(page).getByLabel('Estimated Travel Window').selectOption({ index: 1 })
  await page.getByRole('button', { name: 'Continue to Passions & Stays' }).click()
  await page.getByRole('button', { name: 'Final Step: Your Details' }).click()
}

test.beforeEach(async ({ page }) => {
  // Start every test without a saved draft.
  await page.addInitScript(() => window.sessionStorage.clear())
})

test('submits an inquiry through all four steps and shows the reference', async ({ page }) => {
  const requests = await mockInquiryApi(page)
  await page.goto('/contact')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tell Me About Your Dream Ceylon Journey')

  // Step 1 — nothing is pre-chosen: continuing without a party is blocked
  await page.getByRole('button', { name: 'Continue to Dates & Pace' }).click()
  await expect(page.getByRole('heading', { name: 'When are you hoping to visit Ceylon?' })).toHaveCount(0)
  // picking "family" adds a child automatically (guests always fit the party)
  await page.getByText('Family with Kids').click()
  await expect(wizard(page).getByLabel('Children’s ages')).toBeVisible()
  await wizard(page).getByLabel('Children’s ages').fill('7')
  await page.getByRole('button', { name: 'Continue to Dates & Pace' }).click()

  // Step 2 — the heading receives focus and the change is announced
  await expect(page.getByRole('heading', { name: 'When are you hoping to visit Ceylon?' })).toBeFocused()
  await expect(page.getByText('Step 2 of 4: Dates & Pace')).toBeAttached()
  await wizard(page).getByLabel('Estimated Travel Window').selectOption({ index: 1 })
  await page.getByText('Active & Immersive').click()
  await page.getByRole('button', { name: 'Continue to Passions & Stays' }).click()

  // Step 3 — interests
  await page.getByText('Big Cat & Elephant Safaris').click()
  await page.getByText('Scenic Train Journeys').click()
  await page.getByRole('button', { name: 'Final Step: Your Details' }).click()

  // Step 4 — client validation blocks an empty submit and focuses the first error
  const submit = page.getByRole('button', { name: 'Request My Personalized Trip Blueprint' })
  await submit.click()
  await expect(wizard(page).getByLabel('Full Name')).toBeFocused()
  await expect(wizard(page).getByLabel('Full Name')).toHaveAttribute('aria-invalid', 'true')
  expect(requests).toHaveLength(0)

  await fillDetails(page)
  await submit.click()

  await expect(page.getByRole('heading', { name: 'Ayubowan! Your Blueprint Request is Received.' })).toBeFocused()
  await expect(page.getByTestId('inquiry-reference')).toHaveText('SRD-2026-4242')
  const whatsapp = page.locator('a[href^="https://wa.me/"]', { hasText: /\+?\d/ }).first()
  expect(decodeURIComponent((await whatsapp.getAttribute('href')) ?? '')).toContain('SRD-2026-4242')

  expect(requests).toHaveLength(1)
  expect(requests[0]).toMatchObject({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    whatsapp: '+44 7700 900123',
    partyType: 'family',
    adults: 2,
    children: 1,
    message: 'Children’s ages: 7',
    flexibleDates: true,
    interests: ['Big Cat & Elephant Safaris', 'Scenic Train Journeys'],
    sourcePage: '/contact',
    locale: 'en',
  })
  // The draft is cleared after a successful submission.
  expect(await page.evaluate(() => window.sessionStorage.getItem('serendiva.contact-draft.v1'))).toBeNull()
})

test('prefills from the query string and can be completed with the keyboard only', async ({ page }) => {
  const requests = await mockInquiryApi(page)
  await page.goto(
    '/contact?tour=cultural-odyssey&party=couple&adults=2&month=2099-01&interests=wildlife-safari&source=e2e',
  )
  await expect(page.getByText('About: The Cultural Odyssey')).toBeVisible()

  // Tab into the party radios, change the selection with the arrow keys.
  const couple = page.locator('input[name=partyType][value=couple]')
  for (let i = 0; i < 60 && !(await couple.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press('Tab')
  }
  await expect(couple).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('input[name=partyType][value=family]')).toBeChecked()

  // Continue with Enter on every step.
  for (const name of ['Continue to Dates & Pace', 'Continue to Passions & Stays', 'Final Step: Your Details']) {
    const button = page.getByRole('button', { name })
    for (let i = 0; i < 80 && !(await button.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab')
    }
    await page.keyboard.press('Enter')
  }
  await expect(page.getByRole('heading', { name: 'Where should I send your blueprint?' })).toBeFocused()

  await page.keyboard.press('Tab')
  await page.keyboard.type('Grace Hopper')
  await page.keyboard.press('Tab')
  await page.keyboard.type('grace@example.com')
  await page.keyboard.press('Tab') // calling code (default +44)
  await page.keyboard.press('Tab')
  await page.keyboard.type('7700 900456')
  await page.keyboard.press('Enter') // implicit submit from a text field

  await expect(page.getByTestId('inquiry-reference')).toHaveText('SRD-2026-4242')
  expect(requests[0]).toMatchObject({
    partyType: 'family',
    tourSlug: 'cultural-odyssey',
    interests: ['Big Cat & Elephant Safaris'],
    travelWindow: expect.stringContaining('Onwards'),
    sourcePage: '/contact?source=e2e',
  })
})

test('shows a friendly message when the API rate-limits the visitor', async ({ page }) => {
  await mockInquiryApi(page, 429, { error: { code: 'RATE_LIMITED', message: 'Too many requests' } })
  await page.goto('/contact')
  await chooseBasics(page)
  await fillDetails(page)
  await page.getByRole('button', { name: 'Request My Personalized Trip Blueprint' }).click()
  await expect(wizard(page).getByRole('alert')).toContainText('Please try again in 42 seconds')
  // The answers stay in place for a retry.
  await expect(wizard(page).getByLabel('Full Name')).toHaveValue('Ada Lovelace')
})

/*
 * Opt-in end-to-end check against the REAL API (creates a lead in the dev database and counts towards the
 * 5 requests/min form rate limit):  E2E_REAL_API=1 npx playwright test e2e/contact.spec.ts --project=desktop
 */
test('real API: the inquiry is stored and the SRD reference is shown', async ({ page, isMobile }) => {
  test.skip(!process.env.E2E_REAL_API || isMobile, 'set E2E_REAL_API=1 to run against the real API')
  await page.goto('/contact?source=e2e-real')
  await chooseBasics(page)
  await fillDetails(page)
  await page.getByRole('button', { name: 'Request My Personalized Trip Blueprint' }).click()
  await expect(page.getByTestId('inquiry-reference')).toHaveText(/^SRD-\d{4}-\d{4,}$/, { timeout: 20_000 })
})

test('exact dates replace the travel window when the visitor has fixed dates', async ({ page }) => {
  const requests = await mockInquiryApi(page)
  await page.goto('/contact')
  await page.getByText('Couple / Romantic').click()
  await page.getByRole('button', { name: 'Continue to Dates & Pace' }).click()
  await wizard(page).getByLabel('Flexibility Level').selectOption('fixed')
  await expect(wizard(page).getByLabel('Estimated Travel Window')).toHaveCount(0)
  await wizard(page).getByLabel('Arrival date').fill('2099-03-01')
  await wizard(page).getByLabel('Departure date').fill('2099-03-12')
  await page.getByRole('button', { name: 'Continue to Passions & Stays' }).click()
  await page.getByRole('button', { name: 'Final Step: Your Details' }).click()
  await fillDetails(page)
  await page.getByRole('button', { name: 'Request My Personalized Trip Blueprint' }).click()
  await expect(page.getByTestId('inquiry-reference')).toHaveText('SRD-2026-4242')
  expect(requests[0]).toMatchObject({ travelStart: '2099-03-01', travelEnd: '2099-03-12', flexibleDates: false })
  expect(requests[0]).not.toHaveProperty('travelWindow')
})

test('supports tour blueprint, budget tier, email-only reply, summary review & idempotency key', async ({ page }) => {
  const requests = await mockInquiryApi(page)
  await page.goto('/contact')
  await page.getByText('Solo Explorer').click()
  await page.getByRole('button', { name: 'Continue to Dates & Pace' }).click()
  await wizard(page).getByLabel('Estimated Travel Window').selectOption({ index: 1 })
  await page.getByRole('button', { name: 'Continue to Passions & Stays' }).click()

  // Pick budget tier and (if loaded) tour blueprint + destination chip
  const tourSelect = wizard(page).getByLabel('Based on a curated journey? (Optional)')
  if ((await tourSelect.count()) > 0 && (await tourSelect.locator('option').count()) > 1) {
    await tourSelect.selectOption({ index: 1 })
  }
  await page.getByText('Curated Boutique').click()
  await page.getByRole('button', { name: 'Final Step: Your Details' }).click()

  // Review summary + privacy policy link
  await expect(wizard(page).getByText('Review your trip notes')).toBeVisible()
  await expect(wizard(page).getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', /\/privacy/)

  // Email-only preference makes WhatsApp optional
  await wizard(page).getByLabel('Full Name').fill('Marie Curie')
  await wizard(page).getByLabel('Email Address').fill('marie@example.com')
  await page.getByText('Detailed email').click()
  await page.getByRole('button', { name: 'Request My Personalized Trip Blueprint' }).click()

  await expect(page.getByTestId('inquiry-reference')).toHaveText('SRD-2026-4242')
  expect(requests).toHaveLength(1)
  expect(requests[0].clientRequestId).toMatch(/^[A-Za-z0-9_-]{8,64}$/)
  expect(requests[0].message).toContain('Budget tier: Curated Boutique')
  expect(requests[0].message).toContain('Preferred reply: Detailed email')
  expect(requests[0].whatsapp).toBeUndefined()
})
