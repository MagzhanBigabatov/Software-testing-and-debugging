# Practice Software Testing — Playwright + TypeScript

[![Playwright Tests](https://github.com/MagzhanBigabatov/Software-testing-and-debugging/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/MagzhanBigabatov/Software-testing-and-debugging/actions/workflows/playwright.yml)

A Page Object Model (POM) UI suite for [practicesoftwaretesting.com](https://practicesoftwaretesting.com), with tests for registration, login, purchase/checkout, product comparison, and password reset.

## Requirements

- Node.js 20 or newer recommended
- npm
- Internet access to the public practice website
- Visual Studio Code (recommended) with the official Playwright Test extension (optional)

## Install and run

```bash
npm install
npx playwright install chromium
```

Copy `.env.example` to `.env` and edit the credentials if the public demo account is changed. On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Run the suite in the required order (registration → login → purchase → comparison → password reset):

```bash
npm test
```

The Playwright project dependency chain in `playwright.config.ts` enforces this order when running the full suite. If a dependency project fails, Playwright skips projects that depend on it; use the focused commands below while debugging a single case.

Useful commands:

```bash
npm run test:headed       # Run with a visible browser
npm run test:debug        # Playwright Inspector / step debugging
npm run test:ui           # Interactive Playwright UI
npm run test:register     # Only registration test
npm run test:login        # Only login tests
npm run test:buy          # Purchase and checkout
npm run test:compare      # Product comparison
npm run test:reset        # Forgot-password flow
npm run typecheck         # TypeScript type checking
npm run report            # Open the HTML report after a test run
```

## Project structure

```text
.
├── data/
│   ├── customer.api.ts
│   └── user.factory.ts
├── fixtures/
│   └── pages.fixture.ts
├── pages/
│   ├── base.page.ts
│   ├── login.page.ts
│   ├── register.page.ts
│   ├── product.page.ts
│   ├── cart.page.ts
│   ├── checkout.page.ts
│   └── forgot-password.page.ts
├── tests/
│   ├── register.spec.ts
│   ├── login.spec.ts
│   ├── buy-product.spec.ts
│   ├── compare-products.spec.ts
│   └── reset-password.spec.ts
├── .env.example
├── merge.config.ts
├── package.json
├── playwright.config.ts
└── tsconfig.json
```

## Design decisions

- **Page Object Model:** page interactions and selectors live in `pages/`. Spec files contain no locators.
- **`data-test` selectors:** `playwright.config.ts` sets Playwright's `testIdAttribute` to `data-test`; the page objects use `getByTestId()` as a readable wrapper around those attributes.
- **No fixed sleeps:** interactions use Playwright's auto-waiting and assertions use web-first `expect` methods.
- **Unique registration data:** `createUniqueUser()` generates a unique email on every run. Registration and checkout select the country by the option value (ISO code) and wait for the site's postcode lookup response instead of guessing a localized country label.
- **Live catalog IDs:** product cards use `data-test="product-<database-id>"`, not ordinal IDs such as `product-1`; the product page chooses cards by their shared `data-test` prefix. Purchase chooses the first in-stock card.
- **Password-reset messages:** the current template renders reset feedback as a `role="alert"` inside the forgot-password form and doesn't assign the feedback element a dedicated `data-test`. The page object scopes its assertion to that form.
- **A fresh account per test:** login, purchase and reset tests get their own customer from the `freshCustomer` fixture, which registers one through the site's REST API (`data/customer.api.ts`) before the test starts. The shared public demo account was dropped: other users lock it ("too many failed attempts") and the reset test could change its password, so tests that shared it could not run in parallel. The UI registration test still creates its own account through the form.
- **Checkout address:** the API validates the billing address against the site's postcode lookup, so the checkout page object keeps the street/city/state that the lookup filled in and only fills empty fields with test data.
- **Checkout payment:** the purchase test uses the site's Cash on Delivery demo option; it does not use a real payment card.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | `https://practicesoftwaretesting.com` | Base URL for the UI under test |
| `API_URL` | `https://api.practicesoftwaretesting.com` | REST API used to register a fresh customer for each test |
| `CI` | unset | Set automatically by GitHub Actions; switches on the CI settings below |

## Debugging in VS Code

Open this folder in Visual Studio Code, install dependencies, then use **Run and Debug** with the `Playwright: Debug Current Test File` launch configuration or run `npm run test:debug` in the integrated terminal. Screenshots, videos, and traces for failed tests are written to `test-results/`; the HTML report is written to `playwright-report/`.

## Notes / assumptions

This repository targets the live public demo, which can change independently of this suite. The selectors and flows were aligned to the current published Angular template source and the browser snapshots in the supplied failure logs. The browser suite could not be executed from this build environment, so run `npm test` locally to validate against the live demo. The implementation centralizes selectors in Page Objects; if the public site changes a `data-test` value or checkout button, update the corresponding file under `pages/` rather than editing a spec. The password-reset negative case assumes the app distinguishes an unknown email from a known email, as requested.

## CI

[![Playwright Tests](https://github.com/MagzhanBigabatov/Software-testing-and-debugging/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/MagzhanBigabatov/Software-testing-and-debugging/actions/workflows/playwright.yml)

**CI system: GitHub Actions.** The repository already lives on GitHub, so Actions needs no server or extra account, is free for a public repository, shows runs right next to commits and pull requests, and supports a job matrix for sharding out of the box.

> The repository root is `Software-testing-and-debugging/`; this project is the `SIS3/` subfolder. GitHub only reads workflows from the root, so the file is `.github/workflows/playwright.yml` in the repository root and every step runs with `working-directory: SIS3`.

### Pipeline (`.github/workflows/playwright.yml`)

| Requirement | How it is done |
| --- | --- |
| Runs on every push and PR | `on: push` and `on: pull_request` without branch filters (+ `workflow_dispatch` with `shards` and `trace` inputs for manual runs) |
| Cached deps, browsers, full suite | `actions/setup-node` with `cache: npm`, `npm ci`, `npx playwright install --with-deps chromium`, `npx playwright test --shard=i/N` with no `--grep` / `--project` filters |
| Report and traces as artefacts | `playwright-report` (merged HTML), `test-results-1…4` (traces, screenshots, videos, per-shard JUnit), `junit-report` (merged JUnit); `retention-days: 14`; uploaded with `if: !cancelled()` so they exist when tests fail |
| CI-specific config | `playwright.config.ts` when `CI=true`: `forbidOnly: true`, `retries: 2`, reporters `list` + `blob` + `junit` (`reports/junit.xml`), `trace: 'on-first-retry'`, `fullyParallel: true`, `workers: 2` |
| Parallelism | 4-shard matrix (`fail-fast: false`) + a `merge-reports` job that runs `npx playwright merge-reports --config merge.config.ts` |
| Status badge | badge for `main` at the top of this README |

Other details:

- `concurrency` cancels an outdated run when a new commit is pushed to the same branch.
- Optional repository variables (Settings → Secrets and variables → Actions → Variables): `BASE_URL`, `API_URL`. If they are not set, the defaults from `playwright.config.ts` / `data/customer.api.ts` are used. No passwords are needed: each test registers its own account.
- Locally the suite still runs in the original order (register → login → buy → compare → reset) through project dependencies. In CI the dependencies are removed so that `--shard` can spread tests over jobs; this is safe because no test uses data created by another test.
- Traces: in CI a trace is recorded on the first retry (`trace: 'on-first-retry'`), so a fully green run has none. To get one on demand: **Actions → Playwright Tests → Run workflow**, tick **trace** (adds `--trace=on`). To open it: download `test-results-N`, then `npx playwright show-trace <path>/trace.zip` or drop the file on <https://trace.playwright.dev>; traces are also embedded in the `playwright-report` HTML.

### Cloudflare bot check on GitHub runners

The public demo site is behind Cloudflare. From a home connection it opens normally, but GitHub-hosted runners use data-centre IPs, and Cloudflare sometimes answers a page load with **"Performing security verification / Verify you are human"** instead of the shop. This happened in the first runs: `buy-product` failed in shard 2 because the home page was the Cloudflare check (see the screenshot in the `test-results-2` artefact), while the same test passes locally.

How the suite handles it (`pages/base.page.ts`, `navigate()`):

- after each page load it looks for the Cloudflare check and waits up to 15 s in case it clears by itself;
- if it does not clear, the test is **skipped** with the reason *"Blocked by the site's Cloudflare bot check…"* and an annotation `blocked-by-cloudflare`, visible in the HTML report and the JUnit file;
- the check is **not bypassed**: no stealth plugins, no fake user agent, no captcha solving;
- every other error still fails the test and the run.

So a CI run can end as e.g. *5 passed, 1 skipped*. That means the site blocked the runner, not a bug in the shop or in the tests. The proper long-term fix is to run the open-source Toolshop app inside the pipeline (Docker) and test against `localhost`, which removes both Cloudflare and the shared public data.

### Runtime: before / after

"Before" = the same workflow with 1 shard, "after" = 4 shards. Both are measured on GitHub Actions: **Actions → Playwright Tests → Run workflow**, choose `shards = 1` or `shards = 4`, run each variant 3 times and take the median.

| Configuration | Total run time | Run Playwright tests step (slowest shard) | Run |
| --- | --- | --- | --- |
| 1 job, no sharding | _TODO_ | _TODO_ | [run](_TODO_) |
| 4 shards + merge | _TODO_ | _TODO_ | [run](_TODO_) |

Conclusion: _TODO after the runs._ Expected outcome: the suite has only 6 tests (≈ 30 s of test time), while every shard spends roughly a minute on checkout, `npm ci` and browser install, and the merge job adds its own setup. So the test step gets shorter with 4 shards, but the total wall-clock time drops only slightly or not at all; sharding pays off once the suite is much larger.

Local reference (Windows laptop, not used in the table): the full suite in local mode (serial, 1 worker) took ≈ 31 s; the 4 CI shards run one after another took ≈ 24 s of test time in total (5 + 9 + 5 + 5 s).

### Running the CI configuration locally

```bash
npm ci
npx playwright install --with-deps chromium
CI=true npx playwright test
```

PowerShell:

```powershell
$env:CI = "true"; npx playwright test; Remove-Item Env:CI
```

Shards and the report merge, as in CI (bash / Git Bash):

```bash
mkdir -p all-blob-reports
for i in 1 2 3 4; do CI=true npx playwright test --shard=$i/4 && cp blob-report/*.zip all-blob-reports/; done
npx playwright merge-reports --config merge.config.ts ./all-blob-reports
npx playwright show-report
```

Checked locally: all 6 tests pass in each mode; the merged report and `reports/junit-merged.xml` contain all 6 tests; a temporary `test.only` makes the `CI=true` run fail with the forbidden-`.only` error.
