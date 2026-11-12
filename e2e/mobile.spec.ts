import { test, expect } from '@playwright/test';

test('mobile: discover markets via tab bar and open one', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('link', { name: /Markets/ }).last().click();
  await page.getByTestId('market-card').first().click();
  await expect(page.getByTestId('market-question')).toBeVisible();
  await expect(page.getByTestId('trade-panel').first()).toBeVisible();
  // no horizontal scroll at phone width
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('mobile: Amharic toggle renders Ethiopic text', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Language' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ቀጥሎ የሚሆነውን ተንብይ።');
});
