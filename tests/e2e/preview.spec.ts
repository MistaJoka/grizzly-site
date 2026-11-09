import { expect, test } from '@playwright/test';

// /preview is the private walkthrough for Alex. Default mode here: no sample data.

test('explains why the layout works, with a place to look for every point', async ({ page }) => {
  await page.goto('/preview');
  const why = page.locator('#why');
  await expect(why).toHaveCount(1);
  const items = why.getByRole('listitem');
  await expect(items).toHaveCount(8);
  for (const item of await items.all()) {
    await expect(item.getByRole('heading', { level: 3 })).toBeVisible();
    await expect(item.locator('cite')).toHaveCount(1);
    const href = await item.getByRole('link').first().getAttribute('href');
    expect(href, 'every point names a place on the site').toBeTruthy();
    const [path, hash] = href!.split('#');
    const response = await page.request.get(path || '/');
    expect(response.status(), href!).toBe(200);
    if (hash) expect(await response.text()).toContain(`id="${hash}"`);
  }
});

test('shows no sample review text when sample data is off', async ({ page }) => {
  await page.goto('/preview');
  await expect(page.getByText(/sample review/i)).toHaveCount(0);
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
});

test('anchors the checklist so the sample notice can point at it', async ({ page }) => {
  await page.goto('/preview');
  await expect(page.locator('#needs')).toHaveCount(1);
});
