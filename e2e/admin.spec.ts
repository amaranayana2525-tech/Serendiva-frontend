import { expect, test, type Page } from '@playwright/test'

const ADMIN_ME = {
  id: 'adm_1',
  email: 'admin@serendiva.lk',
  name: 'Dinesh Jayasuriya',
  lastLoginAt: '2026-11-24T08:00:00.000Z',
}

const ADMIN_STATS = {
  inquiries: {
    new: 1,
    thisWeek: 2,
    thisMonth: 4,
    total: 10,
    byStatus: { new: 1, replied: 3, proposal_sent: 2, confirmed: 4, lost: 0, cancelled: 0 },
    conversionRate: 0.9,
    byMonth: [],
    byCountry: [{ country: 'United Kingdom', count: 4 }],
    byTour: [],
    bySource: [],
    latest: [],
  },
  proposals: { new: 0, total: 2 },
  reviews: { pending: 0 },
  newsletter: { confirmed: 5, pending: 1 },
  emailAlerts: { inquiries: 0, proposals: 0 },
}

const SAMPLE_TOUR = {
  id: 'tour_source_1',
  slug: 'cultural-odyssey',
  status: 'published',
  order: 0,
  isFeatured: true,
  isMostPopular: false,
  title: { en: 'The Cultural Odyssey', zh: '文化之旅', de: 'Kulturreise' },
  summary: { en: 'Eight days through ancient kingdoms.' },
  description: { en: 'Rich cultural itinerary.' },
  cardTag: null,
  durationDays: 3,
  durationNights: 2,
  route: ['Sigiriya', 'Kandy'],
  highlights: { en: ['Sigiriya Rock'] },
  badges: null,
  overview: null,
  keyFeatures: null,
  included: { en: [] },
  notIncluded: { en: [] },
  terrains: null,
  routeSummary: null,
  travellerTypes: ['couple'],
  seasons: ['nov-apr'],
  coverId: null,
  cover: null,
  gallery: [],
  days: [
    {
      dayNumber: 1,
      title: { en: 'Arrival & Sigiriya' },
      description: { en: 'Welcome.' },
      drivingTime: null,
      meals: null,
      overnightArea: null,
      details: null,
      isHighlight: false,
      stops: [],
    },
  ],
  categoryIds: ['cat_1'],
  destinationIds: ['dest_1'],
  seoTitle: null,
  seoDescription: null,
  publishedAt: '2026-11-02T00:00:00.000Z',
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-10T00:00:00.000Z',
}

async function mockAdminShell(page: Page, baseURL: string) {
  await page.context().addCookies([{ name: 'sd_session', value: '1', url: baseURL }])
  await page.route('**/api/v1/admin/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ADMIN_ME) }),
  )
  await page.route('**/api/v1/admin/stats', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ADMIN_STATS) }),
  )
}

test('unauthenticated /admin routes redirect to /admin/login with next query parameter', async ({ page }) => {
  await page.goto('/admin/tours')
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Ftours/)
})

test('admin can log a manual inquiry via CreateInquiryDrawer', async ({ page, baseURL }) => {
  await mockAdminShell(page, baseURL ?? 'http://localhost:3000')
  const createdPayloads: Record<string, unknown>[] = []

  await page.route('**/api/v1/admin/tours*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [{ id: 'tour_source_1', title: 'The Cultural Odyssey' }], meta: { total: 1, page: 1, pageSize: 100, totalPages: 1 } }),
    }),
  )
  await page.route('**/api/v1/admin/destinations*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [{ id: 'dest_1', name: 'Sigiriya', slug: 'sigiriya', status: 'published' }], meta: { total: 1, page: 1, pageSize: 100, totalPages: 1 } }),
    }),
  )
  await page.route('**/api/v1/admin/inquiries*', async (route) => {
    const req = route.request()
    if (req.method() === 'POST') {
      const payload = JSON.parse(req.postData() ?? '{}') as Record<string, unknown>
      createdPayloads.push(payload)
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'inq_manual_1',
          reference: 'SRD-2026-7701',
          name: payload.name,
          email: '',
          whatsapp: payload.whatsapp ?? null,
          country: null,
          partyType: null,
          adults: 2,
          children: 0,
          travelStart: null,
          travelEnd: null,
          travelWindow: null,
          flexibleDates: true,
          flexibility: null,
          durationPreference: null,
          pace: null,
          stayStyle: null,
          interests: [],
          tourId: null,
          tour: null,
          destinationId: null,
          destination: null,
          message: null,
          sourcePage: 'admin:whatsapp',
          locale: 'en',
          status: 'replied',
          internalNotes: null,
          repliedAt: '2026-11-24T10:00:00.000Z',
          confirmedAt: null,
          closedAt: null,
          lastContactAt: '2026-11-24T10:00:00.000Z',
          followUpAt: null,
          lostReason: null,
          replyOverdue: false,
          bookedStart: null,
          bookedEnd: null,
          calendarBlock: null,
          events: [],
          emailStatus: 'sent',
          guideEmailSentAt: '2026-11-24T10:00:00.000Z',
          visitorEmailSentAt: null,
          emailAttempts: 0,
          lastEmailError: null,
          createdAt: '2026-11-24T10:00:00.000Z',
          updatedAt: '2026-11-24T10:00:00.000Z',
        }),
      })
    }
    if (req.url().includes('/api/v1/admin/inquiries/inq_manual_1')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'inq_manual_1',
          reference: 'SRD-2026-7701',
          name: 'Manual WhatsApp Lead',
          email: '',
          whatsapp: '+44 7700 900222',
          country: null,
          partyType: null,
          adults: 2,
          children: 0,
          travelStart: null,
          travelEnd: null,
          travelWindow: null,
          flexibleDates: true,
          flexibility: null,
          durationPreference: null,
          pace: null,
          stayStyle: null,
          interests: [],
          tourId: null,
          tour: null,
          destinationId: null,
          destination: null,
          message: null,
          sourcePage: 'admin:whatsapp',
          locale: 'en',
          status: 'replied',
          internalNotes: null,
          repliedAt: '2026-11-24T10:00:00.000Z',
          confirmedAt: null,
          closedAt: null,
          lastContactAt: '2026-11-24T10:00:00.000Z',
          followUpAt: null,
          lostReason: null,
          replyOverdue: false,
          bookedStart: null,
          bookedEnd: null,
          calendarBlock: null,
          events: [],
          emailStatus: 'sent',
          guideEmailSentAt: '2026-11-24T10:00:00.000Z',
          visitorEmailSentAt: null,
          emailAttempts: 0,
          lastEmailError: null,
          createdAt: '2026-11-24T10:00:00.000Z',
          updatedAt: '2026-11-24T10:00:00.000Z',
        }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [],
        meta: { total: 0, page: 1, pageSize: 25, totalPages: 1 },
        counts: { new: 0, replied: 0, proposal_sent: 0, confirmed: 0, lost: 0, cancelled: 0, total: 0 },
      }),
    })
  })

  await page.goto('/admin/inquiries')
  await page.getByRole('button', { name: 'Log inquiry' }).click()
  const dialog = page.getByRole('dialog', { name: 'Log manual inquiry or booking' })
  await expect(dialog).toBeVisible()

  await dialog.getByLabel('Guest name').fill('Manual WhatsApp Lead')
  await dialog.getByLabel('WhatsApp / phone').fill('+44 7700 900222')
  await dialog.getByRole('button', { name: 'Save inquiry' }).click()

  expect(createdPayloads).toHaveLength(1)
  expect(createdPayloads[0]).toMatchObject({ name: 'Manual WhatsApp Lead', whatsapp: '+44 7700 900222', channel: 'whatsapp' })
})

test('admin TourEditor readiness checklist, skeleton day generator, save and ?duplicate= cloning work', async ({
  page,
  baseURL,
}) => {
  await mockAdminShell(page, baseURL ?? 'http://localhost:3000')
  const savedTours: Record<string, unknown>[] = []
  await page.route('**/api/v1/admin/categories*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'cat_1', slug: 'wildlife', order: 0, name: { en: 'Wildlife' } }]),
    }),
  )
  await page.route('**/api/v1/admin/tours', async (route) => {
    const req = route.request()
    if (req.method() === 'POST') {
      const payload = JSON.parse(req.postData() ?? '{}') as Record<string, unknown>
      savedTours.push(payload)
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ...SAMPLE_TOUR, id: 'tour_created_1', slug: String(payload.slug ?? 'new-tour') }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], meta: { total: 0, page: 1, pageSize: 100, totalPages: 1 } }),
    })
  })
  await page.route(`**/api/v1/admin/tours/${SAMPLE_TOUR.id}`, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SAMPLE_TOUR) }),
  )
  await page.route('**/api/v1/admin/tours/tour_created_1', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...SAMPLE_TOUR, id: 'tour_created_1' }) }),
  )

  // 1. New tour: readiness checklist + auto-nights + skeleton day generation + save
  await page.goto('/admin/tours/new')
  await expect(page.getByText('Publish readiness')).toBeVisible()
  await page.getByLabel(/^Title/).fill('Sri Lanka Highlights')
  await page.getByLabel(/^Summary/).fill('Four unforgettable days across Ceylon.')
  await page.getByLabel(/^Days/).fill('4')
  await expect(page.getByLabel(/^Nights/)).toHaveValue('3')

  await page.getByRole('tab', { name: /Itinerary/ }).click()
  await page.getByRole('button', { name: 'Generate 4 days from duration' }).click()
  await expect(page.getByText('Day 4')).toBeVisible()

  await page.getByRole('button', { name: 'Create tour' }).click()
  await expect(page).toHaveURL(/\/admin\/tours\/tour_created_1/)
  expect(savedTours).toHaveLength(1)
  expect((savedTours[0].days as unknown[]).length).toBe(4)

  // 2. Duplicate mode: ?duplicate=tour_source_1 pre-populates draft copy with -copy slug & (Copy) title
  await page.goto(`/admin/tours/new?duplicate=${SAMPLE_TOUR.id}`)
  await expect(page.getByText(/Creating a draft copy of/)).toBeVisible()
  await expect(page.getByLabel(/^Title/)).toHaveValue('The Cultural Odyssey (Copy)')
  await expect(page.getByLabel(/^URL slug/)).toHaveValue('cultural-odyssey-copy')
})
