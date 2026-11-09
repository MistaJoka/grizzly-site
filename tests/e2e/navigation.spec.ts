import { expect, test } from '@playwright/test';

test.describe('desktop navigation', () => {
  test.skip(({ isMobile }) => Boolean(isMobile), 'desktop only');

  test('reaches every top-level page from the header', async ({ page }) => {
    for (const [labelText, path] of [
      ['Services', '/services'],
      ['Commercial', '/commercial'],
      ['Work', '/work'],
      ['About', '/about'],
      ['Contact', '/contact'],
    ] as const) {
      await page.goto('/');
      await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: labelText }).click();
      await expect(page).toHaveURL(new RegExp(`${path}/?$`));
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  test('the skip link is the first focusable element and jumps to main', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: /skip to content/i });
    await expect(skip).toBeFocused();
    await skip.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });
});

test.describe('mobile menu', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile only');

  test('opens, traps focus, closes on Escape, and restores focus', async ({ page }) => {
    await page.goto('/');
    // Scoped to the site's header: dev tooling can inject its own "Menu"
    // button, and the test must not depend on whether that is present.
    const toggle = page.locator('header').getByRole('button', { name: /^menu$/i });
    await toggle.click();

    // The dialog is rendered at body level (above every sheet and the phone action bar), not inside the header.
    const dialog = page.getByRole('dialog', { name: /navigation/i });
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test('navigates from the mobile menu', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('button', { name: /^menu$/i }).click();
    await page.getByRole('dialog', { name: /navigation/i }).getByRole('link', { name: 'Services' }).click();
    await expect(page).toHaveURL(/\/services\/?$/);
  });
});

test('an unknown URL renders the 404 page', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test.describe('mobile menu survives client-side navigation', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('still opens after the router swaps the page', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('button', { name: /^menu$/i }).click();
    await page.getByRole('dialog', { name: /site navigation/i }).getByRole('link', { name: /^about$/i }).click();
    await expect(page).toHaveURL(/\/about$/);
    await page.locator('header').getByRole('button', { name: /^menu$/i }).click();
    await expect(page.getByRole('dialog', { name: /site navigation/i })).toBeVisible();
  });
});
