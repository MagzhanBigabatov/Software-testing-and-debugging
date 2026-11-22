import { expect, type Locator, type Page } from '@playwright/test';

/** Shared browser helpers and the only entry point for site navigation. */
export class BasePage {
  constructor(protected readonly page: Page) {}

  protected testId(id: string): Locator {
    // playwright.config.ts maps getByTestId() to the site's data-test attribute.
    return this.page.getByTestId(id);
  }

  async openHome(): Promise<void> {
    await this.page.goto('/');
    await expect(this.testId('nav-home')).toBeVisible();
  }

  async openLogin(): Promise<void> {
    await this.page.goto('/auth/login');
    await expect(this.testId('login-submit')).toBeVisible();
  }

  async openRegister(): Promise<void> {
    await this.page.goto('/auth/register');
    await expect(this.testId('register-submit')).toBeVisible();
  }

  async openForgotPassword(): Promise<void> {
    await this.page.goto('/auth/forgot-password');
    // The shared email field is used by the login and forgot-password forms.
    await expect(this.testId('email')).toBeVisible();
  }

  async openCart(): Promise<void> {
    await this.testId('nav-cart').click();
    await expect(this.testId('proceed-1')).toBeVisible();
  }

  async expectCurrentUrl(pattern: RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }
}
