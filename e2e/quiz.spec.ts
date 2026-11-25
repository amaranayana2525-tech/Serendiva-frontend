import { expect, test, type Page } from '@playwright/test'

// Trip Finder (/trip-quiz): one question per screen, state in the URL hash, results link to a pre-filled /contact.

const hash = (page: Page) => page.evaluate(() => window.location.hash)

async function answer(page: Page, testIds: string[]) {
  for (const id of testIds) await page.getByTestId(`quiz-option-${id}`).click()
  await page.getByTestId('quiz-continue').click()
}

test.describe('trip quiz', () => {
  test('completing the quiz recommends tours and pre-fills the inquiry link', async ({ page }) => {
    await page.goto('/trip-quiz')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Find Your Perfect/)
    await expect(page.locator('h1')).toHaveCount(1)

    // Continuing without an answer explains what is missing.
    await page.getByTestId('quiz-continue').click()
    await expect(page.locator('#quiz-question-error')).toContainText('Please choose')

    await answer(page, ['couple'])
    await expect.poll(() => hash(page)).toContain('step=2&party=couple')
    await expect(page.locator('#quiz-question-heading')).toBeFocused()
    await expect(page.locator('#quiz-question-heading')).toHaveText(/ideal journey duration/)

    await answer(page, ['balanced'])
    await expect(page.getByTestId('quiz-step-3')).toBeVisible()

    // Up to three passions — the fourth is unavailable.
    for (const id of ['citadels', 'tea', 'safari']) await page.getByTestId(`quiz-option-${id}`).click()
    await expect(page.getByText('3 of 3 Selected')).toBeVisible()
    await expect(page.getByTestId('quiz-option-coast').locator('input')).toHaveAttribute('aria-disabled', 'true')
    await page.getByTestId('quiz-continue').click()

    await answer(page, ['nov-apr'])

    const results = page.getByTestId('quiz-results')
    await expect(results).toBeVisible()
    await expect(page.locator('#quiz-result-heading')).toBeFocused()
    await expect(page.getByTestId('quiz-top-match').getByRole('heading', { level: 3 })).not.toBeEmpty()
    await expect(page.getByTestId('quiz-match-reasons').getByRole('listitem').first()).toBeVisible()
    await expect(page.getByTestId('quiz-alternatives').getByRole('article')).toHaveCount(2)
    expect(await hash(page)).toBe(
      '#step=result&party=couple&duration=balanced&passions=citadels,tea,safari&season=nov-apr',
    )

    const plan = page.getByTestId('quiz-plan-journey')
    const href = await plan.getAttribute('href')
    expect(href).toBeTruthy()
    const url = new URL(href!, 'http://localhost')
    expect(url.pathname).toBe('/contact')
    expect(url.searchParams.get('source')).toBe('trip-quiz')
    expect(url.searchParams.get('tour')).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    expect(url.searchParams.get('party')).toBe('couple')
    expect(url.searchParams.get('adults')).toBe('2')
    expect(url.searchParams.get('interests')?.split(',')).toEqual([
      'cultural-heritage',
      'hill-country',
      'wildlife-safari',
    ])
    expect(url.searchParams.get('month')).toBeTruthy()

    await plan.click()
    // Client-side navigation; the dev server may compile /contact on first visit.
    await expect(page).toHaveURL(/\/contact\?.*source=trip-quiz/, { timeout: 30_000 })
  })

  test('progress survives a reload, Back returns to the previous question, Retake starts over', async ({ page }) => {
    await page.goto('/trip-quiz#step=3&party=family&duration=deep&passions=safari')
    await expect(page.getByTestId('quiz-step-3')).toBeVisible()
    await expect(page.getByTestId('quiz-option-safari')).toHaveAttribute('data-selected', 'true')

    // A step that is not reachable yet is clamped to the first unanswered question.
    await page.goto('/trip-quiz#step=result&party=solo')
    await expect(page.getByTestId('quiz-step-2')).toBeVisible()

    await page.goto('/trip-quiz#step=4&party=family&duration=balanced&passions=safari,coast&season=jul-aug')
    await page.getByTestId('quiz-continue').click()
    await expect(page.getByTestId('quiz-results')).toBeVisible()
    await page.reload()
    await expect(page.getByTestId('quiz-results')).toBeVisible()

    await page.goBack()
    await expect(page.getByTestId('quiz-step-4')).toBeVisible()
    await page.goForward()
    await expect(page.getByTestId('quiz-results')).toBeVisible()

    await page.getByTestId('quiz-retake').first().click()
    await expect(page.getByTestId('quiz-step-1')).toBeVisible()
    await expect(page.locator('input[name=party]:checked')).toHaveCount(0)
  })

  test('can be completed with the keyboard only', async ({ page }) => {
    await page.goto('/trip-quiz')
    const firstParty = page.locator('input[name=party]').first()
    await firstParty.focus()
    await page.keyboard.press('ArrowRight') // radio groups: arrows move and select
    await expect(page.locator('input[name=party]:checked')).toHaveCount(1)
    await page.keyboard.press('Enter') // implicit form submission → next question
    await expect(page.getByTestId('quiz-step-2')).toBeVisible()
    await expect(page.locator('#quiz-question-heading')).toBeFocused()

    await page.locator('input[name=duration]').first().focus()
    await page.keyboard.press('Space')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('quiz-step-3')).toBeVisible()

    await page.locator('input[name=passions]').first().focus()
    await page.keyboard.press('Space')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('quiz-step-4')).toBeVisible()

    await page.locator('input[name=season]').last().focus()
    await page.keyboard.press('Space')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('quiz-results')).toBeVisible()
    await expect(page.locator('#quiz-result-heading')).toBeFocused()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBe(0)
  })
})
