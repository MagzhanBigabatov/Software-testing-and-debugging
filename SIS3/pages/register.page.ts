import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';
import type { RegistrationUser } from '../data/user.factory';

export class RegisterPage extends BasePage {
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly dateOfBirthInput: Locator;
  private readonly streetInput: Locator;
  private readonly postalCodeInput: Locator;
  private readonly houseNumberInput: Locator;
  private readonly postcodeLookupLoading: Locator;
  private readonly cityInput: Locator;
  private readonly stateInput: Locator;
  private readonly countrySelect: Locator;
  private readonly phoneInput: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = this.testId('first-name');
    this.lastNameInput = this.testId('last-name');
    this.dateOfBirthInput = this.testId('dob');
    this.streetInput = this.testId('street');
    this.postalCodeInput = this.testId('postal_code');
    this.houseNumberInput = this.testId('house_number');
    this.postcodeLookupLoading = this.testId('postcode-lookup-loading');
    this.cityInput = this.testId('city');
    this.stateInput = this.testId('state');
    this.countrySelect = this.testId('country');
    this.phoneInput = this.testId('phone');
    this.emailInput = this.testId('email');
    this.passwordInput = this.testId('password');
    this.submitButton = this.testId('register-submit');
  }

  async open(): Promise<void> {
    await this.openRegister();
  }

  async register(user: RegistrationUser): Promise<void> {
    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.dateOfBirthInput.fill(user.dateOfBirth);

    // The country dropdown values are ISO country codes (e.g. "US"), while
    // the visible label is localized and can include text such as "(the)".
    await this.countrySelect.selectOption({ value: user.countryCode });
    await this.postalCodeInput.fill(user.postalCode);

    // Filling country + postal code + house number triggers an asynchronous
    // postcode lookup that populates street/city/state. Wait for that request
    // rather than racing the app's lookup or using a fixed sleep.
    const lookupResponse = this.page.waitForResponse(
      response => response.url().includes('/postcode-lookup')
        && response.request().method() === 'GET',
      { timeout: 15_000 },
    );
    await this.houseNumberInput.fill(user.houseNumber);
    await lookupResponse;
    await expect(this.postcodeLookupLoading).toBeHidden();

    // Keep the generated form data deterministic after the postcode service has
    // populated the address fields.
    await this.streetInput.fill(user.street);
    await this.cityInput.fill(user.city);
    await this.stateInput.fill(user.state);
    await this.phoneInput.fill(user.phone);
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    await this.submitButton.click();
  }

  /** Registration normally routes to login; some deployments sign in directly. */
  async expectRegistrationOutcome(): Promise<void> {
    await expect(this.page).toHaveURL(
      /\/auth\/login(?:[/?#]|$)|\/account(?:[/?#]|$)|https?:\/\/[^/]+\/?(?:\?.*)?$/i,
    );
  }
}
