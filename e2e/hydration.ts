import { expect, type Locator } from '@playwright/test'

/**
 * Waits until React has hydrated an element (React attaches `__reactProps$…` to DOM nodes it owns). Interacting
 * earlier is lost on a slow dev server: the click lands on the static server HTML.
 */
export async function hydrated(locator: Locator) {
  await expect
    .poll(() => locator.evaluate((el) => Object.keys(el).some((key) => key.startsWith('__reactProps'))), {
      timeout: 30_000,
    })
    .toBe(true)
}
