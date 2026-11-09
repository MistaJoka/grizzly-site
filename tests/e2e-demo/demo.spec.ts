import { expect, test, type Page } from '@playwright/test';

// Runs against playwright.demo.config.ts (DEMO_DATA=1, no Groundwork URL).
const SAMPLE_TEL = 'tel:+13055550188';

async function box(page: Page, selector: string) {
  const b = await page.locator(selector).first().boundingBox();
  if (!b) throw new Error(`no box for ${selector}`);
  return b;
}

test.describe('sample notice', () => {
  for (const route of ['/', '/services/lawn-maintenance']) {
    test(`is visible on ${route} and points at what Alex supplies`, async ({ page }) => {
      await page.goto(route);
      const notice = page.getByTestId('sample-notice');
      await expect(notice).toBeVisible();
      await expect(notice).toContainText(/sample/i);
      await expect(notice.getByRole('link')).toHaveAttribute('href', /\/preview#needs$/);
    });
  }

  test('sits above the transparent home header and leaves the headline in the first screen', async ({ page }) => {
    await page.goto('/');
    const notice = await box(page, '[data-testid="sample-notice"]');
    const header = await box(page, 'header');
    expect(header.y).toBeGreaterThanOrEqual(notice.y + notice.height - 1);
    const h1 = await box(page, 'h1');
    expect(h1.y + h1.height).toBeLessThan(page.viewportSize()!.height);
  });
});

test.describe('sample contact details', () => {
  test('the hero offers the sample phone as a tap-to-call link', async ({ page }) => {
    await page.goto('/');
    const hero = page.getByRole('region', { name: /hero/i });
    await expect(hero.locator(`a[href="${SAMPLE_TEL}"]`)).toBeVisible();
  });
});

test.describe('mobile action bar', () => {
  test('shows Call, Text and Quote in the thumb zone on phones, and is hidden on desktop', async ({ page, isMobile }) => {
    await page.goto('/');
    const bar = page.getByTestId('action-bar');
    if (!isMobile) {
      await expect(bar).toBeHidden();
      return;
    }
    await expect(bar).toBeVisible();
    await expect(bar.getByRole('link', { name: /^call$/i })).toHaveAttribute('href', SAMPLE_TEL);
    await expect(bar.getByRole('link', { name: /^text$/i })).toHaveAttribute('href', 'sms:+13055550188');
    await expect(bar.getByRole('link', { name: /^quote$/i })).toHaveAttribute('href', /\/contact$/);
    const b = await box(page, '[data-testid="action-bar"]');
    const viewport = page.viewportSize()!;
    expect(b.y + b.height).toBeGreaterThanOrEqual(viewport.height - 1);
    // WCAG 2.2 SC 2.5.8: every target at least 24 CSS px; ours are full-height segments.
    for (const link of await bar.getByRole('link').all()) {
      const lb = (await link.boundingBox())!;
      expect(lb.height).toBeGreaterThanOrEqual(44);
      expect(lb.width).toBeGreaterThanOrEqual(44);
    }
  });

  test('never covers the last line of the footer', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'desktop has no bar');
    await page.goto('/about');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    const copyright = await box(page, 'footer >> text=/All rights reserved/');
    const bar = await box(page, '[data-testid="action-bar"]');
    expect(copyright.y + copyright.height).toBeLessThanOrEqual(bar.y + 1);
  });

  test('is absent on the private preview page', async ({ page }) => {
    await page.goto('/preview');
    await expect(page.getByTestId('action-bar')).toHaveCount(0);
  });
});

test.describe('trust strip', () => {
  test('adds the first sample credential as a fourth chip', async ({ page }) => {
    await page.goto('/');
    const proof = page.getByRole('region', { name: /proof at a glance/i });
    await expect(proof.getByRole('listitem')).toHaveCount(4);
    await expect(proof).toContainText(/insured/i);
  });
});

test.describe('sample proof', () => {
  test('home shows one review labelled as a sample and an illustrated before/after', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('blockquote')).toHaveCount(1);
    await expect(page.locator('figcaption').first()).toContainText(/^Sample review/);
    const pair = page.getByRole('region', { name: /before and after/i });
    await expect(pair).toHaveCount(1);
    await expect(pair).toContainText(/illustrated sample/i);
    const alts = await pair.locator('img').evaluateAll((nodes) => nodes.map((n) => n.getAttribute('alt') ?? ''));
    expect(alts).toHaveLength(2);
    for (const alt of alts) expect(alt).toMatch(/illustration/i);
  });

  test('about lists all three sample reviews, each labelled', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('blockquote')).toHaveCount(3);
    for (const caption of await page.locator('figcaption').allTextContents()) expect(caption).toMatch(/^Sample review/);
  });

  test('the 40-tree project page shows the illustrated before and after', async ({ page }) => {
    await page.goto('/work/forty-tree-installation');
    const figures = page.getByRole('region', { name: /project photos/i }).locator('figure');
    await expect(figures).toHaveCount(2);
    await expect(figures.nth(0)).toContainText(/before/i);
    await expect(figures.nth(1)).toContainText(/after/i);
    for (const alt of await figures.locator('img').evaluateAll((nodes) => nodes.map((n) => n.getAttribute('alt') ?? ''))) {
      expect(alt).toMatch(/illustration/i);
    }
  });
});

test.describe('sample quote form', () => {
  test('confirms in the page and sends nothing anywhere', async ({ page }) => {
    const outbound: string[] = [];
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      if (!url.startsWith(page.url().split('/').slice(0, 3).join('/')) && !url.startsWith('http://localhost')) outbound.push(url);
      await route.continue();
    });
    await page.goto('/contact');
    const form = page.getByTestId('quote-form');
    await expect(form).toHaveAttribute('data-demo', '');
    await expect(page.getByTestId('form-hint')).toBeVisible();
    await page.getByLabel('Your name').fill('Sample Customer');
    await page.getByLabel('Email').fill('sample@example.com');
    await page.getByRole('button', { name: /send request/i }).click();
    const status = page.getByTestId('quote-sample-sent');
    await expect(status).toBeVisible();
    await expect(status).toContainText(/sample/i);
    await expect(form).toBeHidden();
    expect(outbound).toEqual([]);
  });
});
