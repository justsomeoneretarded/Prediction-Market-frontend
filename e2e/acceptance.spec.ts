/**
 * The full acceptance workflow from the spec, through the real UI:
 * admin creates a 50/50 market → A buys 1,000 YES → B buys 20 NO → holdings & history →
 * admin risk view → close → evidence → second-person approval → dispute window → settlement →
 * balances verified against the LMSR model.
 */
import { test, expect } from '@playwright/test';
import { register, login, buy, yesPct, rnd } from './helpers';

// LMSR closed form (b = 1000, 50/50, no fee) — computed here, not hard-coded
const b = 1000;
const sharesA = Math.floor(b * Math.log(2 * Math.exp(1000 / b) - 1) * 1e6) / 1e6;
const costAfterA = b * Math.log(0.5 * Math.exp(sharesA / b) + 0.5);
const sharesB = Math.floor(b * Math.log(2 * Math.exp((costAfterA + 20) / b) - Math.exp(sharesA / b)) * 1e6) / 1e6;
const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

test('register → trade → resolve → settle (YES wins)', async ({ page }) => {
  const id = rnd();
  const question = `E2E acceptance market ${id}: will the test pass?`;

  // 1. Admin creates a fresh 50/50 market (b = 1000, fee 0) from the dashboard
  await login(page, 'admin');
  await page.goto('/admin?s=markets');
  await page.getByTestId('new-market').click();
  const form = page.getByTestId('create-market-form');
  await form.locator('input[name=question]').fill(question);
  await form.locator('textarea[name=description]').fill('End-to-end acceptance test market (demo).');
  await form.locator('textarea[name=resolutionRules]').fill('Resolves YES if the end-to-end test reaches settlement.');
  await form.locator('input[name=sourcePrimary]').fill('Playwright test run');
  await form.locator('input[name=feeBps]').fill('0');
  await form.locator('input[name=liquidityB]').fill('1000');
  await form.getByRole('button', { name: 'Create market' }).click();
  await expect(page.getByText('Market created and funded')).toBeVisible();

  // 2. User A registers, gets 10,000 virtual birr, opens the market at 50%
  await page.context().clearCookies();
  const userA = `a_${id}`;
  await register(page, userA);
  await page.goto(`/markets?q=${encodeURIComponent(id)}`);
  await page.locator('[data-testid="market-card"]:visible').first().click();
  await expect(page.getByTestId('market-question')).toContainText(id);
  expect(await yesPct(page)).toBe(50);

  // 3. A buys 1,000 birr of YES → price rises
  await page.locator('[data-testid="trade-amount"]:visible').first().fill('1000');
  await expect(page.locator('[data-testid="preview-shares"]:visible').first()).toHaveText(fmt(sharesA));
  await buy(page, 'YES', '1000');
  await expect.poll(() => yesPct(page)).toBe(82);
  const marketUrl = page.url();

  // 4. User B buys 20 birr of NO → price falls slightly
  await page.context().clearCookies();
  const userB = `b_${id}`;
  await register(page, userB);
  await page.goto(marketUrl);
  await buy(page, 'NO', '20');
  await expect.poll(() => yesPct(page)).toBe(80);

  // 5. Holdings and history
  await page.goto('/portfolio');
  await expect(page.getByTestId('open-positions')).toContainText(`${fmt(sharesB)} NO`);
  await expect(page.getByTestId('pf-cash')).toHaveText('9,980.00 Br');
  await page.getByRole('tab', { name: 'Wallet' }).click();
  await expect(page.getByTestId('tx-history')).toContainText('-20.00');

  // 6. Admin sees escrow & exposure for the market
  await login(page, 'admin');
  await page.goto('/admin?s=markets');
  await page.getByRole('row', { name: new RegExp(id) }).getByRole('link', { name: /Manage/ }).click();
  const risk = page.getByTestId('market-risk');
  await expect(risk).toContainText(fmt(693.15 + 1020)); // collateral b·ln2 + trader cash
  await expect(risk).toContainText(fmt(Math.floor(sharesA * 100) / 100)); // pays if YES

  // 7. Close the market
  await page.getByTestId('close-market').click();
  await expect(page.getByText('Trading closed')).toBeVisible();

  // 8. Resolver submits evidence
  const adminMarketUrl = page.url();
  await login(page, 'resolver');
  await page.goto(adminMarketUrl);
  await page.locator('input[name=evidenceUrl]').fill('https://example.org/e2e-result');
  await page.locator('textarea[name=evidenceNotes]').fill('Official result: the test passed.');
  await page.getByTestId('submit-proposal').click();
  await expect(page.getByText('Proposal submitted for review')).toBeVisible();

  // 9. A different reviewer approves → dispute window
  await login(page, 'reviewer');
  await page.goto('/admin?s=resolution');
  const card = page.getByTestId('proposal-card').filter({ hasText: id });
  await card.getByTestId('approve-proposal').click();
  await expect(page.getByText('Confirmed — dispute window started')).toBeVisible();

  // 10. Simulate the dispute window passing; the scheduler finalizes & settles
  await login(page, 'admin');
  await page.goto('/admin?s=system');
  await page.getByTestId('advance-clock').click();
  await expect(page.getByText(/Advanced 25h/)).toBeVisible();
  await expect(page.getByTestId('reconciliation')).toContainText('balanced');

  // 11. Balances: A paid 1 Br per YES share, B lost the stake
  await login(page, userA, 'password123');
  await page.goto('/portfolio');
  const expectedA = 10000 - 1000 + Math.floor(sharesA * 100) / 100;
  await expect(page.getByTestId('pf-cash')).toHaveText(`${fmt(expectedA)} Br`);
  await expect(page.getByTestId('closed-positions')).toContainText(fmt(Math.floor(sharesA * 100) / 100));
  await login(page, userB, 'password123');
  await page.goto('/portfolio');
  await expect(page.getByTestId('pf-cash')).toHaveText('9,980.00 Br');
});
