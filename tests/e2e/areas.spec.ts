import { expect, test } from '@playwright/test';

const AREAS = [
  ['miami', 'Miami'],
  ['miami-beach', 'Miami Beach'],
  ['hialeah', 'Hialeah'],
  ['coral-gables', 'Coral Gables'],
  ['doral', 'Doral'],
  ['kendall', 'Kendall'],
] as const;

for (const [slug, town] of AREAS) {
  test(`/areas/${slug} renders its town, local note, services and neighborhoods`, async ({ page }) => {
    await page.goto(`/areas/${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(town);

    const note = page.getByRole('region', { name: /local conditions/i });
    await expect(note).toBeVisible();
    expect((await note.innerText()).length).toBeGreaterThan(200);

    await expect(page.getByRole('region', { name: /neighborhoods/i }).getByRole('listitem')).not.toHaveCount(0);
    await expect(page.getByRole('region', { name: /services offered/i }).getByRole('listitem')).toHaveCount(5);
    // No invented testimonials on area pages.
    await expect(page.locator('blockquote')).toHaveCount(0);
  });
}

test('no two area pages share their local-conditions prose', async ({ page }) => {
  const notes: string[] = [];
  for (const [slug] of AREAS) {
    await page.goto(`/areas/${slug}`);
    notes.push((await page.getByRole('region', { name: /local conditions/i }).innerText()).trim());
  }
  expect(new Set(notes).size).toBe(AREAS.length);
});

test('area pages are reachable from the footer', async ({ page }) => {
  await page.goto('/');
  for (const [slug] of AREAS) {
    await expect(page.locator(`footer a[href="/areas/${slug}"]`)).toHaveCount(1);
  }
});

test('a service page links a town to its service-in-town page when one exists, else to the area page', async ({ page }) => {
  await page.goto('/services/tree-plant-installation');
  const where = page.getByRole('region', { name: /where we do this work/i });
  await expect(where.locator('a[href="/services/tree-plant-installation/coral-gables"]')).toHaveCount(1);
  await expect(where.locator('a[href="/areas/miami"]')).toHaveCount(1);

  await page.goto('/services/pressure-washing');
  await expect(page.getByRole('region', { name: /where we do this work/i }).locator('a[href="/areas/coral-gables"]')).toHaveCount(1);
});

test('a service-in-town page renders its town, local note, FAQs and breadcrumb links', async ({ page }) => {
  await page.goto('/services/lawn-maintenance/kendall');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Kendall');
  const note = page.getByRole('region', { name: /local conditions/i });
  expect((await note.innerText()).length).toBeGreaterThan(300);
  await expect(page.getByRole('region', { name: /common questions/i }).locator('dt')).not.toHaveCount(0);
  await expect(page.locator('main a[href="/services/lawn-maintenance"]').first()).toBeVisible();
  await expect(page.locator('main a[href="/areas/kendall"]').first()).toBeVisible();
});
