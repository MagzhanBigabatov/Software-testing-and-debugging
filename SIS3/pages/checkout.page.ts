import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';
import type { BillingAddress } from '../data/user.factory';

export class CheckoutPage extends BasePage {
  private readonly continueFromLoginButton: Locator;
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

  async continueFromLoginStep(): Promise<void> {
    await expect(this.continueFromLoginButton).toBeVisible();
    await this.continueFromLoginButton.click();
  }

  async fillBillingAddress(address: BillingAddress): Promise<void> {
    await expect(this.streetInput).toBeVisible();
    await this.countrySelect.selectOption({ value: address.countryCode });
    await this.postalCodeInput.fill(address.postalCode);

    const lookupResponse = this.page.waitForResponse(
      response => response.url().includes('/postcode-lookup')
        && response.request().method() === 'GET',
      { timeout: 15_000 },
    );
    await this.houseNumberInput.fill(address.houseNumber);
    await lookupResponse;
    await expect(this.postcodeLookupLoading).toBeHidden();

    // Keep the street/city/state that the postcode lookup filled in. The API now
    // validates the invoice address against that lookup (422 "The city does not
    // belong to the selected country" otherwise), so overwriting them breaks checkout.
    // Fall back to the test data only if the lookup left a field empty.
    await this.fillIfEmpty(this.streetInput, address.street);
    await this.fillIfEmpty(this.cityInput, address.city);
    await this.fillIfEmpty(this.stateInput, address.state);
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
