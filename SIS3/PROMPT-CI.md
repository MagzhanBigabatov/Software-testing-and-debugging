# Prompt used for the CI part (SIS 3)

**Student Assignment:** SIS 3 
**Course:** Software Testing and Debugging, KBTU  
**AI Tool Used:** Claude Opus 5.5

Here are the actual prompts I used while working on this assignment. I used AI as an assistant to scaffold the Page Objects and test structure, then iterated on specific problems I encountered while testing the website.

---

## Prompt

**Context**

You are working on an existing Playwright Test + TypeScript project (Page Object Model) that tests the public demo shop https://practicesoftwaretesting.com. The folder contains `pages/`, `tests/`, `fixtures/`, `data/`, `playwright.config.ts` and a committed `package-lock.json`. Today the suite runs serially: five projects chained by `dependencies` (register → login → buy-product → compare-products → reset-password), `workers: 1`.

The folder will be committed as the subfolder `SIS3/` of the GitHub repository `MagzhanBigabatov/Software-testing-and-debugging` (default branch `main`). The repository root currently has no `.github/` folder.

**Goal**

Add a CI pipeline on GitHub Actions that satisfies this checklist:

1. Triggers on every `push` and every `pull_request`, with no branch filter.
2. `actions/setup-node` with `cache: npm`, then `npm ci`, `npx playwright install --with-deps chromium`, then the full suite with no `--grep` / `--project` filters.
3. The HTML report, traces and JUnit are uploaded as artefacts kept for 14 days, even when tests fail.
4. A CI branch in `playwright.config.ts` driven only by `process.env.CI`: `forbidOnly`, `retries: 2`, `blob` + `junit` reporters, `trace: 'on-first-retry'`. Without `CI`, the local behaviour must stay exactly as it is now, including the ordered chain.
5. 4 parallel shards in a matrix plus a separate job that merges the blob reports with a `merge.config.ts` into one HTML report and one JUnit file. Let a manual `workflow_dispatch` run pick 1 or 4 shards, so a before/after timing can be measured without editing YAML.
6. A status badge for `main`, plus a CI section in `README.md`: which CI system was chosen and why, what the pipeline does, a before/after timing table (leave TODO cells for numbers that only GitHub can produce), and how to run the CI mode locally (bash and PowerShell).

**Constraints**

- The workflow file lives in the repository root. Write it with a `PROJECT_DIR: SIS3` variable, `working-directory` for `run` steps, `cache-dependency-path` for setup-node, and artefact paths prefixed with the subfolder. Put the file at `.github/workflows/playwright.yml` inside the project folder for now, and say clearly that it must be moved to the repository root.
- Empty GitHub variables arrive as empty strings, so environment fallbacks must use `||`, not `??`.
- Keep spec files free of locators. No `waitForTimeout`.
- Extend `.gitignore` with `reports/`, `all-blob-reports/`, `.act-artifacts/`, `.env`, `.secrets` and the local `auth.json` browser state.
- Ask me before any change that goes beyond the CI files: test logic, page objects, test data.

**Verify before you finish**

- `npx tsc --noEmit` passes.
- `npm test` (local mode, ordered chain) passes.
- `CI=true` runs of shards 1/4 … 4/4, copied into one folder and merged with `merge.config.ts`, contain all tests with zero failures.
- A temporary `test.only` in a real spec file (one that a project's `testMatch` picks up) makes the `CI=true` run fail. Revert it afterwards.
- If tests fail because of the live site rather than the CI setup, find the root cause from traces, the page snapshot and API responses, explain it, and propose the smallest fix.

**Known pitfalls on this site (check whether they still apply)**

- The shared demo customer `customer@practicesoftwaretesting.com` can be locked ("too many failed attempts") and the forgot-password flow may change its password. Tests that need a signed-in user should get their own account from a fixture that calls `POST https://api.practicesoftwaretesting.com/users/register` (expect `201`).
- The login form rejects very long passwords, so keep generated passwords short (under 40 characters).
- `POST /invoices` validates the billing address against the site's postcode lookup. Do not overwrite the street, city and state that the lookup fills in.

**Deliverables**

`playwright.config.ts` (CI branch), `merge.config.ts`, `.github/workflows/playwright.yml`, updated `.gitignore`, `README.md` CI section with badge, and an md file that explains what the AI did, which model was used, the prompt, the decisions and how it was verified.
