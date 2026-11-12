import { Page, expect } from '@playwright/test';

export const PW = process.env.SEED_PASSWORD ?? 'tinbit-demo-123';
export const rnd = () => Math.random().toString(36).slice(2, 8);

export async function register(page: Page, username: string) {
  await page.goto('/register');
  await page.fill('input[name=email]', `${username}@e2e.test`);
  await page.fill('input[name=username]', username);
  await page.fill('input[name=password]', 'password123');
  await page.fill('input[name=dateOfBirth]', '1994-04-04');
  await page.check('input[name=acceptTerms]');
  await page.click('button[type=submit]');
  await expect(page.getByTestId('nav-balance')).toContainText('10,000.00');
}

export async function login(page: Page, login: string, password = PW) {
  await page.context().clearCookies();
  await page.goto('/login');
  await page.fill('input[name=login]', login);
  await page.fill('input[name=password]', password);
  await page.click('button[type=submit]');
  await expect(page.getByTestId('account-menu')).toBeVisible();
}

export async function buy(page: Page, outcome: 'YES' | 'NO', amount: string) {
  await page.locator('[data-testid="side-BUY"]:visible').first().click();
  await page.locator(`[data-testid="outcome-${outcome}"]:visible`).first().click();
  await page.locator('[data-testid="trade-amount"]:visible').first().fill(amount);
  await expect(page.locator('[data-testid="preview-shares"]:visible').first()).not.toHaveText('—');
  await expect(page.locator('[data-testid="trade-submit"]:visible').first()).toBeEnabled();
  await page.locator('[data-testid="trade-submit"]:visible').first().click();
  await expect(page.getByText(/Trade executed/)).toBeVisible();
}

/** Read YES probability (e.g. "82%") from the market page header. */
export async function yesPct(page: Page) {
  return Number((await page.getByTestId('yes-price').innerText()).replace('%', ''));
}
