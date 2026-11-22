# SIS 3 — CI Pipeline for Playwright

[![Playwright Tests](https://github.com/MagzhanBigabatov/Software-testing-and-debugging/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/MagzhanBigabatov/Software-testing-and-debugging/actions/workflows/playwright.yml)

SIS 3 extends the Playwright + TypeScript test suite developed for SIS 2 with a Continuous Integration pipeline using **GitHub Actions**. The tests target the public [Practice Software Testing Toolshop](https://practicesoftwaretesting.com) demo website.

The project is stored in the `SIS3/` subfolder of the repository. The GitHub Actions workflow is stored at the repository root in `.github/workflows/playwright.yml`.

## 1. Test coverage

The project contains five scenario files and six individual tests:

| Scenario | Spec file | Coverage |
| --- | --- | --- |
| Registration | `tests/register.spec.ts` | Register a new customer with unique data |
| Login | `tests/login.spec.ts` | Successful login and rejection of invalid credentials |
| Purchase | `tests/buy-product.spec.ts` | Add a product to the cart and complete checkout |
| Product comparison | `tests/compare-products.spec.ts` | Compare product names and prices |
| Password reset | `tests/reset-password.spec.ts` | Check the response for a registered and an unknown email |

The login scenario contains two tests, which is why five spec files contain six individual tests.

## 2. Technologies and requirements

- Node.js 22 (the workflow uses Node.js 22)
- npm
- Playwright Test
- TypeScript
- GitHub Actions
- Chromium

The test suite targets a public website. Its content, stock availability and bot-protection behaviour can change independently of this repository.

## 3. Install and run locally

Run these commands from the `SIS3/` directory:

```bash
npm ci
npx playwright install chromium
```

Run the full test suite:

```bash
npm test
```

Run the TypeScript check:

```bash
npm run typecheck
```

Other useful commands:

```bash
npm run test:headed       # Run with a visible browser
npm run test:debug        # Open Playwright Inspector
npm run test:ui           # Open Playwright UI
npm run test:register     # Registration only
npm run test:login        # Login tests only
npm run test:buy          # Purchase and checkout only
npm run test:compare      # Product comparison only
npm run test:reset        # Password-reset scenario only
npm run report            # Open the HTML report
```

The local Playwright configuration uses one worker and preserves the scenario order:

`register → login → buy-product → compare-products → reset-password`

The project dependencies enforce that order for a full local run. The focused commands use `--no-deps` so that an individual scenario can be debugged without running the preceding projects.

## 4. Project structure

```text
SIS3/
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
├── .gitignore
├── AI-CI.md
├── PROMPT.md
├── merge.config.ts
├── package.json
├── package-lock.json
├── playwright.config.ts
└── tsconfig.json
```

## 5. Test design

- **Page Object Model:** locators and page interactions are kept in `pages/`; spec files describe scenarios and assertions.
- **Test IDs:** Playwright is configured to use `data-test` as its test ID attribute.
- **No fixed sleeps:** the tests use Playwright auto-waiting and web-first assertions instead of `waitForTimeout`.
- **Unique customer data:** `createUniqueUser()` generates a different email and a short random password for each new account.
- **Independent authenticated tests:** the `freshCustomer` fixture registers a customer through `data/customer.api.ts` for tests that need a signed-in account. This avoids relying on a shared public demo account that can be locked or have its password changed.
- **Checkout address:** the checkout flow preserves the street, city and state returned by the site's postcode lookup because the invoice endpoint validates the billing address.
- **Product availability:** the purchase flow checks whether the selected product can actually be added to the cart and tries another catalogue item when the selected product is out of stock.
- **Payment:** the purchase scenario uses the demo Cash on Delivery option; it does not use a real payment card.

## 6. Continuous Integration

**CI platform: GitHub Actions.** The repository is already hosted on GitHub, so Actions can run on pushes and pull requests without a separately managed CI server. It also provides matrix jobs, artefact storage and status reporting on the repository.

Workflow file:

```text
.github/workflows/playwright.yml
```

The workflow is at the **repository root**, not inside `SIS3/`. Its run steps use `working-directory: SIS3`, and the npm cache uses `SIS3/package-lock.json`.

### Pipeline stages

1. **Trigger:** run on every push and pull request. A manual `workflow_dispatch` run is also available.
2. **Setup:** check out the repository, set up Node.js 22 with npm caching, run `npm ci` and install Chromium with system dependencies.
3. **Test:** run the full Playwright suite without `--grep` or `--project` filters. The default workflow uses four parallel shards. The manual run can select one or four shards for timing comparison.
4. **Upload:** upload per-shard test results and debugging artefacts.
5. **Merge:** download the blob reports and use `merge.config.ts` to generate one HTML report and one merged JUnit file.

### CI-specific Playwright settings

When `process.env.CI` is set, `playwright.config.ts` enables:

- `forbidOnly: true` to prevent an accidental `test.only`;
- `retries: 2` for retrying unstable tests;
- `fullyParallel: true` and two workers per shard;
- `list`, `blob` and `junit` reporters;
- `trace: 'on-first-retry'`;
- independent projects without the local dependency chain, so sharding can distribute tests across jobs.

Without CI mode, the local ordered project chain, one worker and HTML reporting are retained.

### Reports and artefacts

The workflow stores the final HTML report, merged JUnit report and per-shard test results. Test results can include traces, screenshots and videos when generated by the configured Playwright settings.

The final report artefacts are configured for 14-day retention. Intermediate blob reports are used by the merge job.

To inspect a trace, download the relevant test-results artefact and run:

```bash
npx playwright show-trace path/to/trace.zip
```

Alternatively, open <https://trace.playwright.dev> and drop the trace ZIP there.

### Manual runs and traces

Open **Actions → Playwright Tests → Run workflow**.

Use the `shards` input to run the workflow with one shard (before comparison) or four shards (after comparison). The manual `trace` input can be enabled when a trace is needed for debugging. The exact inputs are defined in `.github/workflows/playwright.yml`.

### Verified GitHub Actions run

The following run confirms that the four-shard pipeline and report-merging job completed successfully:

| Date | Configuration | Run | Commit | Result | Total duration |
| --- | --- | --- | --- | --- | --- |
| 22 Nov 2026 | 4 shards + merge | [Updated SIS3 #13](https://github.com/MagzhanBigabatov/Software-testing-and-debugging/actions/runs/45040807912) | `bc2cf68` | Success | **1 min 19 sec** |

In this run, all four test-shard jobs completed successfully, followed by the `Merge reports` job (17 seconds). GitHub Actions produced 10 artefacts: four blob reports, four per-shard test-results artefacts, the merged HTML report and the merged JUnit report.

The run also displayed five Node.js 20 deprecation warnings for the `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4` and `actions/download-artifact@v4` actions. These warnings did not fail the run, but the workflow actions should be reviewed and updated to versions compatible with the runner's current Node.js runtime.

## 7. Runtime comparison

The assignment asks for a comparison between one shard and four shards. The values must be collected from GitHub Actions, because local timings do not include GitHub runner setup, dependency installation, browser installation or report merging.

Run each configuration three times and use the median. Record the total workflow duration and the duration of the slowest **Run Playwright tests** step.

Run #13 above is one successful four-shard run. It provides the total workflow duration, but it does not by itself provide the three measurements needed to calculate the median. Two more four-shard runs and three one-shard runs are still required.

| Configuration | Median total workflow time | Median test-step time (slowest shard) | Run links |
| --- | --- | --- | --- |
| 1 job, no sharding | _TODO_ | _TODO_ | _TODO_ |
| 4 shards + merge | _TODO_ | _TODO_ | [Run #13](https://github.com/MagzhanBigabatov/Software-testing-and-debugging/actions/runs/45040807912) + 2 more runs needed |

**Conclusion:** _Add after collecting all six GitHub Actions measurements._

A local timing is not a substitute for this table. The suite contains only six tests, while each shard also spends time checking out the repository, installing packages and setting up Chromium. Because of this fixed overhead, four shards may reduce test execution time without reducing total workflow time by the same amount.

## 8. Cloudflare behaviour on GitHub runners

The target is a public demo site behind Cloudflare. GitHub-hosted runners sometimes receive a security-verification page instead of the shop. This is an external site restriction, not a test assertion.

The purchase flow was adjusted to avoid an unnecessary page reload after login: it adds the product as a guest and signs in at the checkout step. The implementation does not use stealth plugins, spoofed browser fingerprints or captcha-solving logic.

If Cloudflare blocks a run, inspect the screenshot and trace in the corresponding test-results artefact. A skipped test with the documented `blocked-by-cloudflare` annotation means the runner was blocked by the site; it should not be described as a successful checkout.

## 9. Run the CI configuration locally

From the `SIS3/` directory:

```bash
npm ci
npx playwright install --with-deps chromium
CI=true npx playwright test
```

In PowerShell:

```powershell
$env:CI = "true"
npx playwright test
Remove-Item Env:CI
```

To run the four shards sequentially and merge the reports in Bash or Git Bash:

```bash
mkdir -p all-blob-reports

for i in 1 2 3 4; do
  CI=true npx playwright test --shard=$i/4
  cp blob-report/*.zip all-blob-reports/
done

npx playwright merge-reports --config merge.config.ts ./all-blob-reports
npx playwright show-report
```

For this local merge check, each shard's blob ZIP must be copied to the shared folder before the next shard overwrites `blob-report/`.

## 10. AI assistance

Claude Code (Claude Opus 5.5) was used as a development assistant for selected CI configuration, test-support changes and troubleshooting. The existing SIS 2 Playwright project was the starting point; the SIS 3 implementation was reviewed and tested against the assignment requirements and the public demo site.

See AI-CI.md for the work notes and verification record, and PROMPT.md for the main working brief and follow-up topics.
