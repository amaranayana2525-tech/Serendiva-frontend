import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.clear())
})

test('German (/de) home, wizard and newsletter confirmation render localized copy and submit locale=de', async ({
  page,
}) => {
  const sent: Record<string, unknown>[] = []
  await page.route('**/api/v1/inquiries', async (route) => {
    sent.push(JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>)
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ reference: 'SRD-2026-5501', message: 'Danke' }),
    })
  })

  await page.goto('/de')
  await expect(page.getByRole('link', { name: 'Reise planen' }).first()).toBeVisible()

  await page.goto('/de/contact')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Erzählen Sie mir von Ihrer Traumreise durch Ceylon')

  const form = page.getByRole('form', { name: 'Individuelle Reiseanfrage' })
  await page.getByText('Alleinreisend').click()
  await page.getByRole('button', { name: 'Weiter zu Reisezeit & Tempo' }).click()
  await form.getByLabel('Voraussichtlicher Reisezeitraum').selectOption({ index: 1 })
  await page.getByRole('button', { name: 'Weiter zu Wünschen & Stilen' }).click()
  await page.getByRole('button', { name: 'Letzter Schritt: Ihre Kontaktdaten' }).click()

  await form.getByLabel('Vollständiger Name').fill('Lukas Weber')
  await form.getByLabel('E-Mail-Adresse').fill('lukas@example.de')
  await form.getByLabel('Landesvorwahl').selectOption('+49')
  await form.getByLabel('WhatsApp / Mobilnummer').fill('170 1234567')
  await page.getByRole('button', { name: 'Meinen persönlichen Reiseentwurf anfordern' }).click()

  await expect(page.getByTestId('inquiry-reference')).toHaveText('SRD-2026-5501')
  expect(sent).toHaveLength(1)
  expect(sent[0]).toMatchObject({ locale: 'de', name: 'Lukas Weber', whatsapp: '+49 170 1234567' })

  await page.route('**/api/v1/newsletter/confirm?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ status: 'confirmed' }),
    })
  })
  await page.goto('/de/newsletter/confirm?token=tok_de_confirm_12345678')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Willkommen beim Private Dispatch Journal')
})

test('Chinese (/zh) home, wizard and newsletter confirmation render localized copy and submit locale=zh', async ({
  page,
}) => {
  const sent: Record<string, unknown>[] = []
  await page.route('**/api/v1/inquiries', async (route) => {
    sent.push(JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>)
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ reference: 'SRD-2026-5502', message: '感谢' }),
    })
  })

  await page.goto('/zh')
  await expect(page.getByRole('link', { name: '定制行程' }).first()).toBeVisible()

  await page.goto('/zh/contact')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('告诉我您的梦想锡兰旅程')

  const form = page.getByRole('form', { name: '定制旅行咨询' })
  await page.getByText('独自探索').click()
  await page.getByRole('button', { name: '下一步：日期与节奏' }).click()
  await form.getByLabel('预计出行月份').selectOption({ index: 1 })
  await page.getByRole('button', { name: '下一步：兴趣与住宿' }).click()
  await page.getByRole('button', { name: '最后一步：联系方式' }).click()

  await form.getByLabel('您的姓名').fill('林先生')
  await form.getByLabel('电子邮箱').fill('lin@example.cn')
  await form.getByLabel('国家区号').selectOption('+86')
  await form.getByLabel('WhatsApp / 手机号码').fill('138 0013 8000')
  await page.getByRole('button', { name: '申请我的私人定制行程蓝图' }).click()

  await expect(page.getByTestId('inquiry-reference')).toHaveText('SRD-2026-5502')
  expect(sent).toHaveLength(1)
  expect(sent[0]).toMatchObject({ locale: 'zh', name: '林先生', whatsapp: '+86 138 0013 8000' })

  await page.route('**/api/v1/newsletter/confirm?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ status: 'confirmed' }),
    })
  })
  await page.goto('/zh/newsletter/confirm?token=tok_zh_confirm_12345678')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('欢迎订阅私人通讯')
})
