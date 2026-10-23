import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'https://practicesoftwaretesting.com';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  // The target is a shared public demo. Serial execution avoids tests changing
  // the same demo account/cart at the same time.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL,
    testIdAttribute: 'data-test',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  // Projects and explicit dependencies enforce the requested end-to-end
  // order in one Playwright invocation while preserving one combined report.
  // Use --no-deps when running a single spec for focused debugging.
  projects: [
    {
      name: 'register',
      testMatch: '**/register.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'login',
      testMatch: '**/login.spec.ts',
      dependencies: ['register'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'buy-product',
      testMatch: '**/buy-product.spec.ts',
      dependencies: ['login'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'compare-products',
      testMatch: '**/compare-products.spec.ts',
      dependencies: ['buy-product'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'reset-password',
      testMatch: '**/reset-password.spec.ts',
      dependencies: ['compare-products'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'test-results',
});
