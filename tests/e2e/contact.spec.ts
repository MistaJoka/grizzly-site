import { expect, test } from '@playwright/test';

// playwright.config.ts starts the dev server with GROUNDWORK_QUOTE_URL=https://quotes.example.test/r/grizzly-test
const ACTION = 'https://quotes.example.test/r/grizzly-test/send';

test('the quote form posts natively (multipart) to the hosted Groundwork route', async ({ page }) => {
  await page.goto('/contact');
  const form = page.getByTestId('quote-form');
  await expect(form).toHaveAttribute('action', ACTION);
  await expect(form).toHaveAttribute('method', /post/i);
  await expect(form).toHaveAttribute('enctype', 'multipart/form-data');
});

test('uses the exact field names Groundwork parses', async ({ page }) => {
  await page.goto('/contact');
  const names = await page.locator('#quote-form [name]').evaluateAll((n) => n.map((x) => x.getAttribute('name')));
  expect(names).toEqual(
    expect.arrayContaining(['name', 'phone', 'email', 'address', 'service', 'message', 'preferred_dates', 'photos', 'website']),
  );
});

test('name is required and photos are restricted to Groundwork-accepted types', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.getByLabel('Your name')).toHaveAttribute('required', '');
  await expect(page.locator('input[name="photos"]')).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
});

test('the honeypot is off-screen, hidden from assistive tech, and skipped by Tab', async ({ page }) => {
  await page.goto('/contact');
  const honeypot = page.locator('input[name="website"]');
  await expect(honeypot).toHaveAttribute('tabindex', '-1');
  await expect(honeypot).toHaveValue('');
  const box = await honeypot.boundingBox();
  expect(box!.x).toBeLessThan(0);
  await expect(page.locator('#quote-form [aria-hidden="true"]').locator('input[name="website"]')).toHaveCount(1);
});

test('submitting sends the multipart request to the Groundwork host (intercepted, nothing leaves the machine)', async ({ page }) => {
  let seen: { url: string; method: string; type: string; body: string } | undefined;
  await page.route('https://quotes.example.test/**', async (route) => {
    const req = route.request();
    seen = { url: req.url(), method: req.method(), type: req.headers()['content-type'] ?? '', body: req.postData() ?? '' };
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>stub</h1>' });
  });
  await page.goto('/contact');
  await page.getByLabel('Your name').fill('Test Customer');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('About the job').fill('Please quote mowing and edging.');
  await page.getByRole('button', { name: /send request/i }).click();
  await expect.poll(() => seen?.url).toBe(ACTION);
  expect(seen!.method).toBe('POST');
  expect(seen!.type).toContain('multipart/form-data');
  expect(seen!.body).toContain('Test Customer');
  expect(seen!.body).toMatch(/name="website"\r\n\r\n\r\n/);
});

test('the page links to the hosted form and invents no phone or email', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.getByRole('link', { name: /open it here/i })).toHaveAttribute('href', 'https://quotes.example.test/r/grizzly-test');
  await expect(page.locator('a[href^="tel:"], a[href^="mailto:"]')).toHaveCount(0);
});
