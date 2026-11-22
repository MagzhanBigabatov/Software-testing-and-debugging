import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Cloudflare in front of the public demo sometimes answers a full page load from
 * a cloud IP (e.g. a GitHub Actions runner) with a "Performing security
 * verification" / "Verify you are human" page instead of the shop.
 */
const BOT_CHALLENGE_TEXT = /performing security verification|verify you are human|just a moment/i;
const BOT_CHALLENGE_GRACE_MS = 15_000;

/** Shared browser helpers and the only entry point for site navigation. */
export class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Navigate and check for the Cloudflare bot check. The check is not bypassed:
   * if it does not clear by itself within a short grace period, the test is
   * marked as skipped with an explicit reason, so the report shows that the site
   * blocked the runner rather than reporting a product bug. Any other problem
   * still fails the test as usual.
   */
  protected async navigate(path: string): Promise<void> {
    await this.page.goto(path);

    const challenge = this.page.getByText(BOT_CHALLENGE_TEXT).first();
    if (!(await challenge.isVisible())) {
      return;
    }

    try {
      await expect(challenge).toBeHidden({ timeout: BOT_CHALLENGE_GRACE_MS });
    } catch {
      const reason = `Blocked by the site's Cloudflare bot check when opening "${path}" `
        + '(happens on cloud CI runners, not on a local machine). Not a test failure.';
      test.info().annotations.push({ type: 'blocked-by-cloudflare', description: reason });
      test.skip(true, reason);
    }
  }

  protected testId(id: string): Locator {
    // playwright.config.ts maps getByTestId() to the site's data-test attribute.
    return this.page.getByTestId(id);
  }

  async openHome(): Promise<void> {
    await this.navigate('/');
    await expect(this.testId('nav-home')).toBeVisible();
  }

  async openLogin(): Promise<void> {
    await this.navigate('/auth/login');
    await expect(this.testId('login-submit')).toBeVisible();
  }

  async openRegister(): Promise<void> {
    await this.navigate('/auth/register');
    await expect(this.testId('register-submit')).toBeVisible();
  }

  async openForgotPassword(): Promise<void> {
    await this.navigate('/auth/forgot-password');
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
