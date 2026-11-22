import 'dotenv/config';
import { defineConfig, devices, type Project } from '@playwright/test';

// GitHub Actions (and GitLab/Jenkins) set CI=true. Everything CI-specific is
// switched on by this one flag; without it the config behaves as before.
const isCI = Boolean(process.env.CI);

// `||` (not `??`) so an empty value, e.g. an unset GitHub variable, falls back.
const baseURL = process.env.BASE_URL || 'https://practicesoftwaretesting.com';

// The local run keeps the original end-to-end order through project
// dependencies: register -> login -> buy-product -> compare-products -> reset-password.
// Use --no-deps when running a single spec for focused debugging.
const orderedProjects: Project[] = [
  { name: 'register', testMatch: '**/register.spec.ts' },
  { name: 'login', testMatch: '**/login.spec.ts', dependencies: ['register'] },
  { name: 'buy-product', testMatch: '**/buy-product.spec.ts', dependencies: ['login'] },
  { name: 'compare-products', testMatch: '**/compare-products.spec.ts', dependencies: ['buy-product'] },
  { name: 'reset-password', testMatch: '**/reset-password.spec.ts', dependencies: ['compare-products'] },
].map((project) => ({ ...project, use: { ...devices['Desktop Chrome'] } }));

// In CI the chain is removed so that --shard can spread tests over parallel
// jobs. This is safe: no spec reads data created by another spec. Registration
// creates its own random account; login/buy/reset use the known demo customer.
const ciProjects: Project[] = orderedProjects.map(({ dependencies: _ignored, ...project }) => project);

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  // CI: shards split individual tests, not whole files.
  // Local: serial, because the target is a shared public demo account/cart.
  fullyParallel: isCI,
  workers: isCI ? 2 : 1,
  // A forgotten test.only fails the CI run instead of silently skipping tests.
  forbidOnly: isCI,
  // A flaky test is reported as "flaky" instead of turning the run red.
  retries: isCI ? 2 : 0,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: isCI
    ? [
        ['list'],
        ['blob'], // one file per shard, merged later by merge.config.ts
        ['junit', { outputFile: 'reports/junit.xml' }],
      ]
    : [
        ['list'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
      ],
  use: {
    baseURL,
    testIdAttribute: 'data-test',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    // CI: a trace of exactly the attempt that was retried.
    trace: isCI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  projects: isCI ? ciProjects : orderedProjects,
  outputDir: 'test-results',
});
