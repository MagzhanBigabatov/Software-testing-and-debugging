import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';
import type { BillingAddress, CustomerCredentials } from '../data/user.factory';

export class CheckoutPage extends BasePage {
  private readonly continueFromLoginButton: Locator;
  private readonly signInEmailInput: Locator;
  private readonly signInPasswordInput: Locator;
  private readonly signInSubmitButton: Locator;
  private readonly streetInput: Locator;
  private readonly postalCodeInput: Locator;
  private readonly houseNumberInput: Locator;
  private readonly postcodeLookupLoading: Locator;
  private readonly cityInput: Locator;
  private readonly stateInput: Locator;
  private readonly countrySelect: Locator;
  private readonly continueToPaymentButton: Locator;
  private readonly paymentMethodSelect: Locator;
  private readonly finishButton: Locator;
  private readonly paymentSuccessMessage: Locator;
  private readonly orderConfirmation: Locator;

  constructor(page: Page) {
    super(page);
    this.continueFromLoginButton = this.testId('proceed-2');
    // Step 2 of the checkout wizard shows the login form for a guest.
    this.signInEmailInput = this.testId('email');
    this.signInPasswordInput = this.testId('password');
    this.signInSubmitButton = this.testId('login-submit');
    this.streetInput = this.testId('street');
    this.postalCodeInput = this.testId('postal_code');
    this.houseNumberInput = this.testId('house_number');
    this.postcodeLookupLoading = this.testId('postcode-lookup-loading');
    this.cityInput = this.testId('city');
    this.stateInput = this.testId('state');
    this.countrySelect = this.testId('country');
    this.continueToPaymentButton = this.testId('proceed-3');
    this.paymentMethodSelect = this.testId('payment-method');
    this.finishButton = this.testId('finish');
    this.paymentSuccessMessage = this.testId('payment-success-message');
    // The completed-order panel is currently identified by an id, not data-test.
    this.orderConfirmation = this.page.locator('#order-confirmation');
  }

  /**
   * Sign in inside the checkout wizard (step 2) instead of on /auth/login.
   * The whole purchase then happens inside the single-page app without a full
   * page reload after login.
   */
  async signInAtCheckout(customer: CustomerCredentials): Promise<void> {
    await expect(this.signInSubmitButton).toBeVisible();
    await this.signInEmailInput.fill(customer.email);
    await this.signInPasswordInput.fill(customer.password);
    await this.signInSubmitButton.click();
    await expect(this.continueFromLoginButton).toBeVisible();
  }

  async continueFromLoginStep(): Promise<void> {
    await expect(this.continueFromLoginButton).toBeVisible();
    await this.continueFromLoginButton.click();
  }

  async fillBillingAddress(address: BillingAddress): Promise<void> {
    await expect(this.streetInput).toBeVisible();

    // The form calls /postcode-lookup (debounced, sometimes twice) while the
    // postal code and house number are typed. A late response rewrites the
    // address and can clear the house number, so track the lookups and only
    // continue once they have settled.
    const lookups = this.trackPostcodeLookups();
    try {
      await this.countrySelect.selectOption({ value: address.countryCode });
      await this.postalCodeInput.fill(address.postalCode);
      await this.houseNumberInput.fill(address.houseNumber);

      // Street/city/state must come from the lookup: the API validates the
      // invoice address against it (422 "The city does not belong to the
      // selected country" for any other value), so the test never types its
      // own values there and waits for the site to fill them. Only the house
      // number, which a late lookup can clear, is typed again.
      await expect(async () => {
        expect(lookups.settled(), 'postcode lookup still running').toBe(true);
        await this.fillIfEmpty(this.houseNumberInput, address.houseNumber);
        for (const lookupField of [this.streetInput, this.cityInput, this.stateInput]) {
          await expect(lookupField).not.toHaveValue('', { timeout: 1_000 });
        }
        await expect(this.postcodeLookupLoading).toBeHidden({ timeout: 1_000 });
        await expect(this.continueToPaymentButton).toBeEnabled({ timeout: 1_000 });
        expect(lookups.settled(), 'a new postcode lookup started').toBe(true);
      }).toPass({ timeout: 20_000 });
    } finally {
      lookups.stop();
    }
  }

  /**
   * Count /postcode-lookup requests. "Settled" = none in flight and none sent
   * or finished during the last second (covers the form's debounce).
   */
  private trackPostcodeLookups(): { settled: () => boolean; stop: () => void } {
    const quietPeriodMs = 1_000;
    let inFlight = 0;
    let lastActivity = Date.now();
    const isLookup = (url: string) => url.includes('/postcode-lookup');
    const onRequest = (request: { url(): string }) => {
      if (isLookup(request.url())) { inFlight += 1; lastActivity = Date.now(); }
    };
    const onDone = (request: { url(): string }) => {
      if (isLookup(request.url())) { inFlight = Math.max(0, inFlight - 1); lastActivity = Date.now(); }
    };
    this.page.on('request', onRequest);
    this.page.on('requestfinished', onDone);
    this.page.on('requestfailed', onDone);
    return {
      settled: () => inFlight === 0 && Date.now() - lastActivity >= quietPeriodMs,
      stop: () => {
        this.page.off('request', onRequest);
        this.page.off('requestfinished', onDone);
        this.page.off('requestfailed', onDone);
      },
    };
  }

  private async fillIfEmpty(input: Locator, value: string): Promise<void> {
    if (!(await input.inputValue()).trim()) {
      await input.fill(value);
    }
  }

  async continueToPayment(): Promise<void> {
    await this.continueToPaymentButton.click();
    await expect(this.paymentMethodSelect).toBeVisible();
  }

  async selectCashOnDelivery(): Promise<void> {
    await this.paymentMethodSelect.selectOption('cash-on-delivery');
  }

  async finishPurchase(): Promise<void> {
    // The payment wizard can first validate the selected method, show a
    // payment-success message, and then require a second click to confirm the
    // order. Do not treat that intermediate message as a completed purchase.
    await this.finishButton.click();
    await expect(this.paymentSuccessMessage.or(this.orderConfirmation)).toBeVisible();

    if (!(await this.orderConfirmation.isVisible())) {
      await this.finishButton.click();
    }

    await expect(this.orderConfirmation).toBeVisible();
  }

  async expectPurchaseCompleted(): Promise<void> {
    await expect(this.orderConfirmation).toBeVisible();
    await expect(this.orderConfirmation).toContainText(/success|order|invoice|thank|paid/i);
  }

  /** Complete the authenticated customer checkout using a non-card demo method. */
  async completePurchase(address: BillingAddress): Promise<void> {
    await this.continueFromLoginStep();
    await this.fillBillingAddress(address);
    await this.continueToPayment();
    await this.selectCashOnDelivery();
    await this.finishPurchase();
    await this.expectPurchaseCompleted();
  }
}
