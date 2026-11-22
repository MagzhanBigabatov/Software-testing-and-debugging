# SIS 3 — AI Assistance Notes

**Assignment:** SIS 3 — CI Pipeline for Playwright  
**Course:** Software Testing and Debugging, KBTU  
**AI tool:** Claude Opus 5.5 (Claude Code)

## About this document

SIS 3 builds on the Playwright project from SIS 2. I did not start the test suite from scratch: the existing Page Object Model, test scenarios and most of the project structure were already in place. The main goal of this assignment was to add and verify a CI pipeline for that project.

I used Claude Code during some parts of the work, mainly when setting up the workflow and Playwright configuration, reviewing code changes and investigating test failures. I provided the assignment requirements and the issues I encountered, then checked the suggestions and test results before deciding what to keep. Some code was prepared with AI assistance, so I have recorded that here rather than describing the implementation as entirely manual.

## 1. What the assignment required

The task was to run the existing Playwright suite automatically through Continuous Integration. The main requirements were:

- run the tests on pushes and pull requests;
- install Node.js dependencies and Chromium on a clean runner;
- use CI-specific Playwright settings;
- split the tests into parallel shards;
- merge the shard results into one HTML report and one JUnit file;
- keep test reports and debugging artefacts;
- document the pipeline and add a GitHub Actions status badge.

I used GitHub Actions because the project is already hosted on GitHub. This also meant I could use its workflow runs, matrix jobs and artefact storage without setting up a separate CI server.

## 2. Starting point: SIS 2

The SIS 2 project already had five test scenario files:

- customer registration;
- login with valid and invalid credentials;
- product purchase and checkout;
- product comparison;
- password reset.

There are six individual tests in total because the login scenario includes both a successful login and an invalid-credentials check.

For SIS 3, I kept this test structure and worked on making it run reliably in CI, including when tests are split between parallel jobs.

## 3. Main changes and decisions

I used the assignment checklist to decide what needed to be added or changed. The main implementation choices were:

| Area | What was done |
| --- | --- |
| CI platform | Used GitHub Actions because the repository is hosted on GitHub. |
| Local and CI modes | Kept the existing project flow for local runs. In CI, project dependencies are disabled so tests can be distributed across shards. |
| Parallel execution | Added a four-shard matrix and a separate job to merge the reports. A manual workflow input allows one-shard and four-shard runs for the timing comparison. |
| Test data | Avoided relying on one shared demo customer. Tests that require authentication create a fresh customer through the site's registration API. |
| Checkout | Kept the street, city and state returned by the postcode lookup because the invoice endpoint checks those address values. |
| Cloudflare | Did not add stealth settings or CAPTCHA bypass logic. The purchase flow was adjusted to avoid an unnecessary full-page reload after login. |
| Reports | Used Playwright blob reports for merging, JUnit output and an HTML report with traces and other failure artefacts. |

Claude Code helped me prepare and review parts of the GitHub Actions workflow, the Playwright and merge configurations, and some test-support changes. I also used it to interpret error messages and consider possible fixes. I checked those suggestions against the assignment requirements and the behaviour of the demo site; the first suggested solution was not always the one I kept.

## 4. Problems I ran into

The following problems appeared while I was testing the pipeline against the public Practice Software Testing demo site.

### 4.1. Checking `forbidOnly`

At first, my temporary `test.only` check did not give a useful result. I had added it to a new spec file, but the Playwright projects did not select that file because of their `testMatch` settings. I repeated the check in an existing spec file that the projects already run. The CI run then failed with the expected `forbidOnly` error, and I removed the temporary change.

### 4.2. The shared demo account

The public demo account was not reliable for parallel tests. Repeated login attempts could lock it, and the password-reset test could change its password. This meant that tests could affect one another when they ran at the same time.

To avoid that dependency, tests that need an authenticated user create a fresh customer through `POST /users/register`. The `freshCustomer` fixture in `fixtures/pages.fixture.ts` gets the account details from `data/customer.api.ts`.

### 4.3. Password length

A password generated for API registration was accepted by the API but was too long for the website's login form. I changed the password factory so it generates a shorter random password.

### 4.4. Checkout returned HTTP 422

The invoice endpoint rejected some billing addresses when the street, city or state did not match the values returned by the site's postcode lookup.

The checkout flow was adjusted to keep the address returned by the lookup instead of replacing it with separately entered values. The customer profile created through the API uses the same address.

### 4.5. Cloudflare verification on GitHub runners

The demo site sometimes showed a Cloudflare verification page on GitHub-hosted runners. I could not reproduce this consistently from a normal home connection.

I tried a temporary approach that skipped the test when a challenge appeared, but it made the purchase test wait and could leave it skipped. The final flow avoids an unnecessary full-page navigation: the product is added to the cart as a guest, and the user signs in at checkout. I did not add stealth browser settings, browser-fingerprint changes or CAPTCHA-solving logic.

### 4.6. A product could be out of stock

Repeated purchase tests changed the stock of products in the shared demo catalogue. The purchase flow now checks the product page before adding an item to the cart. If the Add to cart button is disabled, it returns to the catalogue and tries another product.

These problems were a useful reminder to check proposed fixes against the real behaviour of the demo site rather than relying on code suggestions alone.

## 5. Main files involved

| File | Purpose |
| --- | --- |
| `.github/workflows/playwright.yml` | GitHub Actions workflow. It is in the repository root, outside `SIS3/`; its test steps use `SIS3` as the working directory. |
| `playwright.config.ts` | Playwright configuration, including settings that are enabled when `CI` is set. |
| `merge.config.ts` | Merges the shard blob reports into an HTML report and a JUnit file. |
| `data/customer.api.ts` | Creates a fresh customer through the site's REST API. |
| `fixtures/pages.fixture.ts` | Provides Page Objects and the `freshCustomer` fixture. |
| `data/user.factory.ts` | Generates unique customer details and shorter random passwords. |
| `pages/checkout.page.ts` | Handles the postcode lookup and billing-address flow. |
| `pages/base.page.ts` | Handles navigation and the Cloudflare-check observation described above. |
| `tests/*.spec.ts` | Contains the five test scenarios. |
| `.gitignore` | Excludes dependencies, reports, local environment files and browser-state files. |
| `README.md` | Explains the SIS 3 project, CI pipeline, local commands and timing comparison. |
| `PROMPT.md` | Contains the main request used for the CI work and the follow-up prompt topics. |

## 6. Checks and results

These are the results recorded during development on Windows with Node.js 22 and Playwright 1.64.1.

| Check | Result recorded |
| --- | --- |
| `npx tsc --noEmit` | Passed |
| `npm test` in local mode | 6 of 6 tests passed |
| CI shard runs (`--shard=1/4` to `--shard=4/4`) | 2 + 2 + 1 + 1 tests; all passed |
| Blob report merge | HTML report generated; merged JUnit reported 6 tests and 0 failures |
| Temporary `test.only` in a matched spec | CI failed with the expected `forbidOnly` error |
| Purchase test with `--repeat-each=15` | 15 of 15 passed after the purchase-flow changes |

These results describe the runs completed during development. Since the tests use a public demo site, I should run the suite again before submission in case the site's state or behaviour has changed.

## 7. What still needs to be recorded for submission

The timing comparison in `README.md` must use actual GitHub Actions run data, not estimates from a local machine.

To collect it:

1. Run the manual workflow with `shards = 1` three times.
2. Run it with `shards = 4` three times.
3. Record the total workflow time and the time of the slowest **Run Playwright tests** shard.
4. Calculate the median for each configuration.
5. Add the run links and a short conclusion to `README.md`.

The GitHub Actions run pages are also the evidence for the hosted workflow, artefact retention and cache restoration.

## 8. AI-use note

Claude Opus 5.5 was one of the tools I used while working on SIS 3. It helped with parts of the CI workflow and configuration, test-support code, and troubleshooting. The starting Playwright suite came from SIS 2. I used the assignment requirements to guide the work, reviewed the suggested changes, and checked the resulting tests and CI runs. This document records the areas where I used AI assistance; it does not describe the whole assignment as AI-generated.

The main prompt and the topics of the follow-up requests are recorded in `PROMPT.md`.
