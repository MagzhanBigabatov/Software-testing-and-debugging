import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';

export class ForgotPasswordPage extends BasePage {
  private readonly emailInput: Locator;
  private readonly submitButton: Locator;
  private readonly form: Locator;
  private readonly alertMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.form = this.testId('forgot-password-form');
    this.emailInput = this.testId('email');
    this.submitButton = this.testId('forgot-password-submit');
    // In the current site template, success/error messages have role="alert"
    // but no data-test of their own. Scope them to the data-test form.
    this.alertMessage = this.form.getByRole('alert');
  }

  async open(): Promise<void> {
    await this.openForgotPassword();
    await expect(this.submitButton).toBeVisible();
  }

  async requestReset(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }

  async expectRequestConfirmation(): Promise<void> {
    // The site's alert auto-dismisses, so start this web-first assertion
    // immediately after clicking the submit button.
    await expect(this.alertMessage).toBeVisible();
    await expect(this.alertMessage).toContainText(/email|reset|sent|password|link/i);
  }

  async expectInvalidEmailError(): Promise<void> {
    await expect(this.alertMessage).toBeVisible();
    await expect(this.alertMessage).toContainText(
      /invalid|not found|does not exist|not registered|unable|error|could not|failed/i,
    );
  }
}
