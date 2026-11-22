# AI usage report: CI pipeline for Playwright

**Assignment:** SIS: CI pipeline for Playwright (built on the SIS 2 test suite)
**Course:** Software Testing and Debugging, KBTU
**AI tool:** Claude Code, desktop app (Code tab)
**Model:** Claude Opus 5.5 (`claude-opus-5-5`)
**Prompt:** see [PROMPT-CI.md](PROMPT-CI.md)

---

## 1. How the AI was used

The AI read the assignment guide and the existing SIS 2 project. It asked clarifying questions before changing anything, wrote the CI files, ran the suite locally in every mode the pipeline uses, and debugged the failures it hit against the live site. Every decision that changed test behaviour was confirmed by me first.

Questions the AI asked, and my answers:

| Question | Decision |
| --- | --- |
| Where will the project live on GitHub? | As the `SIS3/` subfolder of `MagzhanBigabatov/Software-testing-and-debugging`, so the workflow uses `working-directory: SIS3` |
| The serial chain blocks sharding. Remove it? | Remove it in CI only, as long as tests do not break. Locally the order register → login → … stays |
| Where to put the prompt and the AI report? | New files `PROMPT-CI.md` and `AI-CI.md`; the old SIS 2 `PROMPT.md` is untouched |
| What to do with `auth.json` (site cookies)? | Add it to `.gitignore` |
| The demo account is locked. How to fix? | Each test that needs a user registers its own account through the API |

## 2. What was added or changed

| File | Change |
| --- | --- |
| `.github/workflows/playwright.yml` | **New.** Push / PR / manual triggers; a 4-shard matrix (1 shard for a manual "before" run); npm cache; `npm ci`; Chromium with system deps; full suite with `--shard`; blob, trace and JUnit artefacts (14 days); a `merge-reports` job that builds one HTML report and one JUnit file. **Must be moved to the repository root.** |
| `playwright.config.ts` | CI branch on `process.env.CI`: `forbidOnly`, `retries: 2`, `fullyParallel`, `workers: 2`, `list` + `blob` + `junit` reporters, `trace: 'on-first-retry'`, projects without dependencies. Local mode is unchanged (chain, 1 worker, HTML report). `BASE_URL` fallback uses `\|\|` so an empty CI variable still works. |
| `merge.config.ts` | **New.** HTML + `reports/junit-merged.xml` for `merge-reports`. |
| `data/customer.api.ts` | **New.** `registerCustomerViaApi()` creates a fresh customer via `POST /users/register`. |
| `fixtures/pages.fixture.ts` | New `freshCustomer` fixture: registers an account before the test that asks for it. |
| `tests/login.spec.ts`, `buy-product.spec.ts`, `reset-password.spec.ts` | Use `freshCustomer` instead of the shared demo account. Still no locators in specs. |
| `data/user.factory.ts` | `knownCustomer()` removed; the generated password is shorter (still random every run). |
| `pages/checkout.page.ts` | Keeps the address that the postcode lookup fills in. |
| `.gitignore` | `reports/`, `all-blob-reports/`, `.act-artifacts/`, `.env`, `.secrets`, `auth.json`. |
| `.env.example`, `README.md`, `DESCRIPTION.md` | CI section with badge, timing table and local commands; updated env vars and test descriptions. |

## 3. Problems found and how they were solved

1. **The `forbidOnly` check seemed not to work.** The first check used a new temporary spec file, but the projects only match the five named spec files, so Playwright ignored it. Repeated with `test.only` inside `compare-products.spec.ts`: the `CI=true` run fails as expected.
2. **The shared demo account got locked.** Login returned "Account locked, too many failed attempts. Please contact the administrator." The account is public and used by everyone. The reset-password test could also change its password, and with parallel shards the reset test can run before login and buy. Fix: every test that needs a signed-in user registers its own account through the API, so tests are independent and safe to shard. Registration still happens before login, inside each test.
3. **"Password length is invalid" on the login form.** The generated password was 42 characters. The API accepted it, but the UI form rejects it. Fix: shorter random password.
4. **Checkout failed with HTTP 422.** `POST /invoices` returned *"The billing_country does not match the entered address. The city does not belong to the selected country."* The page object was overwriting the lookup address (for postcode 90001 the site returns its own street, city and state) with "Los Angeles / California". Checked directly against the API: the lookup address is accepted, the overwritten one is rejected. Fix: keep the lookup values and fill a field from test data only if it is empty.

5. **Cloudflare bot check on GitHub runners.** The first GitHub runs went red: `buy-product` in shard 2 failed in all 3 attempts. The screenshot from the run's artefact showed Cloudflare's "Performing security verification / Verify you are human" page instead of the shop. Locally the test passes, because Cloudflare treats a home IP and a data-centre IP differently. The AI explicitly refused to bypass the check (stealth plugins, a fake browser fingerprint or captcha solving would mean evading another site's bot protection). Two options were proposed: (1) detect the check and skip the test with a clear reason, or (2) run the Toolshop app in Docker inside CI. Option 1 was chosen because of the deadline. `BasePage.navigate()` now waits up to 15 s for the check to clear and otherwise marks the test as skipped with the annotation `blocked-by-cloudflare`. Verified with a fake challenge page served via `page.route` (result: skipped) and a full real run (6 / 6 passed).

## 4. Verification (local, Windows, Node 22, Playwright 1.64.1)

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | passes |
| `npm test` (local mode, ordered chain) | 6 / 6 passed |
| `CI=true npx playwright test --shard=i/4`, i = 1…4 | 2 + 2 + 1 + 1 tests, all passed |
| `merge-reports --config merge.config.ts` | one HTML report; `junit-merged.xml`: `tests="6" failures="0"` |
| Temporary `test.only` with `CI=true` | run fails with the forbidden `.only` error |

## 5. What still has to be done on GitHub

The AI cannot produce these, because they only exist after a push:

- Move `SIS3/.github/` to the repository root.
- Push to a feature branch and open a PR into `main`: runs for both events.
- Check the second run's `setup-node` log for the restored npm cache.
- Check the artefacts: `playwright-report`, `test-results-1…4`, `junit-report`. Open a trace on trace.playwright.dev.
- Run the manual workflow with `shards = 1` and `shards = 4` (3 times each) and fill in the README timing table and conclusion.
- Merge the PR. The badge on `main` then shows a status.
- The first push went to `main` by mistake, so the feature-branch and PR runs were made with a separate branch `SIS3` (on-demand trace input + root README).
