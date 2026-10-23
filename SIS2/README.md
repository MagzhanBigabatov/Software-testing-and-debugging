# Practice Software Testing — Playwright + TypeScript

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
- **Shared public demo account:** login, purchase, and reset tests use `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`. Registration uses a separate fresh account. Tests are serialized locally to reduce collisions in the shared cart/account.
- **Checkout payment:** the purchase test uses the site's Cash on Delivery demo option; it does not use a real payment card.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | `https://practicesoftwaretesting.com` | Base URL for the UI under test |
| `TEST_USER_EMAIL` | `customer@practicesoftwaretesting.com` | Known demo customer |
| `TEST_USER_PASSWORD` | `welcome01` | Known demo customer's password |

## Debugging in VS Code

Open this folder in Visual Studio Code, install dependencies, then use **Run and Debug** with the `Playwright: Debug Current Test File` launch configuration or run `npm run test:debug` in the integrated terminal. Screenshots, videos, and traces for failed tests are written to `test-results/`; the HTML report is written to `playwright-report/`.

## Notes / assumptions

This repository targets the live public demo, which can change independently of this suite. The selectors and flows were aligned to the current published Angular template source and the browser snapshots in the supplied failure logs. The browser suite could not be executed from this build environment, so run `npm test` locally to validate against the live demo. The implementation centralizes selectors in Page Objects; if the public site changes a `data-test` value or checkout button, update the corresponding file under `pages/` rather than editing a spec. The password-reset negative case assumes the app distinguishes an unknown email from a known email, as requested.
