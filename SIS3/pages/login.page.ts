import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = this.testId('email');
    this.passwordInput = this.testId('password');
    this.submitButton = this.testId('login-submit');
    this.errorMessage = this.testId('login-error')
      .or(this.testId('alert'))
      .or(this.testId('notification'));
  }

  async open(): Promise<void> {
    await this.openLogin();
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectAccountPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/account(?:\/|$|\?)/i);
  }

  async expectInvalidLogin(): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.page).toHaveURL(/\/auth\/login(?:[/?#]|$)/i);
    await expect(this.submitButton).toBeVisible();
  }
}
