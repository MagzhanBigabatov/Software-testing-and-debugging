# Description for Automated Testing - SIS 2

**Student Assignment:** SIS 2 - Test Automation with Playwright
**Course:** Software Testing and Debugging, KBTU  
**Target Platform:** https://practicesoftwaretesting.com/ 
**Framework:** Playwright with TypeScript (Visual Studio Code)  
**Design Pattern:** Page Object Model with Custom Fixtures and Test Data Factory

---

## 1. Project Objective

The goal of this project is to develop and execute an automated end-to-end (E2E) test suite for the Practice Software Testing (Toolshop) web application.

The test suite covers five core scenarios: customer registration, login, product purchase, product comparison, and password reset.

The project uses the following design principles:

- **Page Object Model (POM):** Page objects encapsulate locators and page interactions, keeping test spec files focused on test scenarios and their expected outcomes.
- **Custom Fixtures:** The `fixtures/pages.fixture.ts` file provides page objects to tests through Playwright fixtures.
- **Dynamic Test Data:** The `data/user.factory.ts` file generates unique registration data, including an email address and a password for each registration attempt.
- **Reliable Synchronization:** The tests use Playwright's auto-waiting and web-first assertions without using `waitForTimeout`.
- **Centralized Locators:** The project configures `data-test` as the test ID attribute, allowing page objects to use Playwright's `getByTestId()` method.
- **Test Reporting:** Playwright generates an HTML report and saves debugging artifacts, such as screenshots, videos, and traces, when tests fail.

---

## 2. Automated Test Cases Specification

The project contains five test scenario files and six individual tests. The login scenario is divided into positive and negative tests.

### TC-01: Customer Registration (`tests/register.spec.ts`)

**Objective:** Verify that a new customer can register an account using unique test data.

**Test Steps:**

1. Generate customer data using `createUniqueUser()` from `data/user.factory.ts`.
2. Navigate to the registration page.
3. Fill in the required registration form fields.
4. Submit the registration form.

**Assertions:**

- Verify that registration completes and the application navigates to the expected destination.

### TC-02: Customer Login (`tests/login.spec.ts`)

**Objective:** Verify that customers can sign in with valid credentials and that invalid credentials are rejected.

**Test A — Valid Credentials:**

1. Open the login page.
2. Retrieve the configured demo customer credentials using `knownCustomer()`.
3. Enter the email and password.
4. Submit the login form.

**Assertions:**

- Verify that the user reaches the account page.

**Test B — Invalid Credentials:**

1. Open the login page.
2. Generate an email address that is not expected to belong to a registered customer.
3. Submit the login form with invalid credentials.

**Assertions:**

- Verify that an error is displayed and the user remains on the login page.

### TC-03: Product Purchase and Checkout (`tests/buy-product.spec.ts`)

**Objective:** Verify that a customer can add a product to the cart and complete the checkout process.

**Test Steps:**

1. Sign in using the configured demo customer credentials.
2. Open a product from the catalog.
3. Capture the product's name and add it to the cart.
4. Open the cart and verify the selected product and its quantity.
5. Proceed through checkout.
6. Enter the billing address.
7. Select Cash on Delivery as the payment method.
8. Complete the purchase.

**Assertions:**

- Verify that the cart contains the expected product.
- Verify that the product quantity is correct.
- Verify that the checkout reaches the expected purchase confirmation.

### TC-04: Product Comparison (`tests/compare-products.spec.ts`)

**Objective:** Retrieve and compare the names and prices of two different products.

**Test Steps:**

1. Open the first catalog product and capture its name and price.
2. Open a second catalog product and capture its name and price.
3. Compare the captured product information.

**Assertions:**

- Verify that the two products have different names.
- Verify that both prices are positive numeric values.
- Verify the calculated price comparison.

### TC-05: Password Reset (`tests/reset-password.spec.ts`)

**Objective:** Verify the response of the forgot-password flow for a known customer email and an unknown email address.

**Test Steps:**

1. Open the forgot-password page.
2. Submit a password reset request using the configured demo customer email.
3. Verify the expected confirmation.
4. Reopen the forgot-password page.
5. Submit a request using a generated email address that is not expected to belong to a registered customer.
6. Verify the expected response for the unknown email.

**Assertions:**

- Verify that the known-email request produces the expected confirmation.
- Verify that the unknown-email request produces the response expected by the test.

---

## 3. Test Suite Architecture

```text
SIS2/
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
├── tsconfig.json
├── Description.md
├── Prompt.md
├── Review.md
└── README.md