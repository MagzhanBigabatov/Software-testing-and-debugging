import { test as base, expect } from '@playwright/test';
import { BasePage } from '../pages/base.page';
import { LoginPage } from '../pages/login.page';
import { RegisterPage } from '../pages/register.page';
import { ProductPage } from '../pages/product.page';
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';
import { ForgotPasswordPage } from '../pages/forgot-password.page';

interface PageFixtures {
  basePage: BasePage;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  forgotPasswordPage: ForgotPasswordPage;
}

export const test = base.extend<PageFixtures>({
  basePage: async ({ page }, use) => {
    await use(new BasePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  forgotPasswordPage: async ({ page }, use) => {
    await use(new ForgotPasswordPage(page));
  },
});

export { expect };
