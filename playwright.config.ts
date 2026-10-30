import { defineConfig, devices } from '@playwright/test';

// E2E_PORT lets a run sidestep a stale `astro dev` left on 4321 (reuseExistingServer would
// otherwise test against whatever that old server has in its environment).
const port = Number(process.env.E2E_PORT ?? 4321);
const origin = `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
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
    command: `npm run dev -- --port ${port}`,
    url: origin,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Astro 7 auto-detects agentic shells (e.g. Claude Code, via the
    // `am-i-vibing` package) and silently forks `astro dev` into a detached
    // background daemon, exiting the wrapper process immediately. Playwright
    // then reports "Process from config.webServer exited early" even though
    // a server did come up. ASTRO_DEV_BACKGROUND=1 is the flag Astro's own
    // background-mode spawner sets on its child to say "just run in the
    // foreground" — setting it here opts back into normal blocking behavior
    // so Playwright can manage the process lifecycle itself.
    env: {
      ASTRO_DEV_BACKGROUND: '1',
      PLAYWRIGHT: '1',
      // Fake values so e2e exercises the configured state. No request is ever sent to these hosts.
      GROUNDWORK_QUOTE_URL: 'https://quotes.example.test/r/grizzly-test',
      SITE_URL: origin,
    },
  },
});
