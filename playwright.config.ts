import { defineConfig, devices } from '@playwright/test';

/**
 * E2E tests run against a running stack (API + web + seeded DB):
 *   API:  cd ../prediction-market-backend && pnpm db:seed && pnpm start
 *   Web:  pnpm build && pnpm start
 *   then: pnpm e2e
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: process.env.BASE_URL ?? 'http://localhost:3000', trace: 'off' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: /mobile\.spec\.ts/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec\.ts/ },
  ],
});
