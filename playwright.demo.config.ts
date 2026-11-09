import { defineConfig, devices } from '@playwright/test';

// Demo-mode end-to-end run: the same site with DEMO_DATA=1, on its own port so it never collides with
// a default-mode dev server (whose tests assert the opposite facts: no phone, no reviews).
const port = Number(process.env.E2E_DEMO_PORT ?? 4322);
const origin = `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests/e2e-demo',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: origin,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run dev -- --port ${port} --ignore-lock`, // see playwright.config.ts
    url: origin,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ASTRO_DEV_BACKGROUND: '1', // see playwright.config.ts
      PLAYWRIGHT: '1',
      DEMO_DATA: '1',
      HOLD_BACK: '1', // same combination staging runs; the config guard refuses an indexable demo build
      // No GROUNDWORK_QUOTE_URL: the contact form must fall back to the in-page sample confirmation.
      SITE_URL: origin,
    },
  },
});
