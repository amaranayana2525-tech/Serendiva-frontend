import { defineConfig, devices } from '@playwright/test'

/**
 * E2E tests (npm run test:e2e). Without PLAYWRIGHT_BASE_URL it uses http://localhost:3000 and starts `npm run dev`
 * when nothing is listening there; with PLAYWRIGHT_BASE_URL it never starts a server (start yours first). Set PW_CHROMIUM_PATH to use a pre-installed Chromium instead of the bundled one.
 *   PowerShell:  $env:PLAYWRIGHT_BASE_URL="http://localhost:3000"; npm run test:e2e   (after npm run build; npm run start)
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const executablePath = process.env.PW_CHROMIUM_PATH || undefined
const port = new URL(baseURL).port || '3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  // With PLAYWRIGHT_BASE_URL set we always test the server that is already running there (Next 16 allows only one
  // `next dev` per project, so starting a second one would fail). Otherwise start (or reuse) a dev server on :3000.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --port ${port}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 180_000,
      },
})
