# Prompt Notes — SIS 3: CI Pipeline for Playwright

**Assignment:** SIS 3 — CI Pipeline for Playwright  
**Course:** Software Testing and Debugging, KBTU  
**AI tool:** Claude Code (Claude Desktop)  
**Model:** Claude Opus 5.5

This file records the main brief used when requesting AI assistance for the CI extension. It is based on the working instructions supplied during development and is edited for readability. The follow-up section summarises the debugging requests; it is not presented as a verbatim transcript of every chat message.

---

## 1. Main implementation brief

### Context

I have an existing Playwright Test + TypeScript project that tests the public demo shop:

<https://practicesoftwaretesting.com>

The project already uses the Page Object Model and contains `pages/`, `tests/`, `fixtures/`, `data/`, `playwright.config.ts` and a committed `package-lock.json`.

The local test suite runs in a defined order through five Playwright projects:

`register → login → buy-product → compare-products → reset-password`

The repository is:

`MagzhanBigabatov/Software-testing-and-debugging`

The project for this assignment is stored in the `SIS3/` subfolder. GitHub Actions workflows must be placed in the repository-root `.github/workflows/` directory. Steps that run the project commands must use `SIS3` as their working directory.

### Goal

Extend the existing test project with a GitHub Actions CI pipeline. Keep the existing local workflow usable while adding CI-specific behaviour.

### Requirements

1. Run the workflow on every `push` and every `pull_request`, without restricting it to a particular branch.
2. Set up Node.js and enable the npm cache. Install dependencies with `npm ci`, install Chromium with its system dependencies, and run the full Playwright suite without test-name or project filters.
3. Upload the HTML report, traces and JUnit output as workflow artefacts. Keep the final report artefacts for at least 7 days; the intended retention is 14 days.
4. Enable CI-specific Playwright settings through `process.env.CI`:
   - `forbidOnly: true`;
   - `retries: 2`;
   - blob and JUnit reporters;
   - `trace: 'on-first-retry'`.
   When CI is not enabled, preserve the local test order and local reporting behaviour.
5. Run the tests in four parallel shards and merge their blob reports in a separate job with `merge.config.ts`.
6. Add a manual workflow run that can use one shard or four shards so that the before/after execution time can be measured without editing the workflow YAML.
7. Add a status badge for the `main` branch and a CI section to the README. Explain the choice of GitHub Actions, describe the pipeline, include a before/after timing table and document how to run CI mode locally.
8. Keep spec files free of locators and do not use `waitForTimeout`.
9. Keep the existing test logic and Page Object structure unless a change is needed to solve a demonstrated issue. Explain the reason for changes outside the CI configuration.

### Repository and path constraints

- The workflow belongs in `.github/workflows/playwright.yml` at the repository root.
- The Playwright project itself is in `SIS3/`.
- Use `working-directory: SIS3` for project commands.
- Use the `SIS3/package-lock.json` path for the npm cache dependency.
- Prefix artefact paths with `SIS3/` when the workflow runs from the repository root.
- Use `||` rather than `??` for environment-variable fallbacks where an empty GitHub variable should fall back to a default.
- Ignore generated reports, local environment files, secrets and browser state such as `auth.json`.

### Verification requested

- Run `npx tsc --noEmit`.
- Run `npm test` in local mode.
- Run each CI shard (`1/4`, `2/4`, `3/4`, `4/4`) and merge the blob reports.
- Confirm that the merged report contains the full suite with no failures.
- Temporarily put `test.only` inside a spec file matched by the Playwright projects and confirm that the CI run fails because of `forbidOnly`. Revert the temporary change afterwards.
- When a test fails against the live site, use the error output, trace, page snapshot or API response to identify the cause before proposing a targeted fix.

---

## 2. Follow-up topics during troubleshooting

The work continued through smaller requests after the main brief. The main topics were:

### A. Existing test account

The shared demo account could become locked or have its password changed by the reset-password test. The proposed direction was to use a fresh account for tests that need authentication, created through the site's registration API:

`POST https://api.practicesoftwaretesting.com/users/register`

### B. Password validation

The login form rejected a generated password that was too long. The password factory was adjusted to produce shorter random passwords.

### C. Checkout address validation

The invoice endpoint returned HTTP 422 when the billing address did not match the site's postcode lookup result. The checkout logic needed to preserve the lookup-provided street, city and state rather than replacing them with unrelated values.

### D. Cloudflare verification on CI runners

GitHub-hosted runners sometimes received a Cloudflare verification page instead of the shop. The investigation compared the failed CI run with local behaviour. The selected direction was to avoid unnecessary page reloads during the purchase flow, not to bypass Cloudflare or imitate a different browser.

### E. Product availability

A catalogue item could become out of stock after repeated purchase tests. The purchase flow needed to check whether the product page allowed adding the item to the cart and try another product when the current one was unavailable.

### F. CI checks and reports

Additional checks covered shard output merging, the `forbidOnly` setting, report artefacts and the difference between local ordered execution and parallel CI execution.

---

## 3. Scope of AI assistance

Claude Code was used to help interpret the assignment requirements, draft or revise selected configuration and test-support changes, and analyse errors found during local and CI runs.

The existing SIS 2 test project was the starting point. AI assistance was not used as a substitute for reviewing the requirements or checking the implementation. Suggested changes were evaluated against the project structure, test output and behaviour of the public demo site.
