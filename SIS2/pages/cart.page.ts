import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';

export class CartPage extends BasePage {
  private readonly productTitle: Locator;
  private readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.productTitle = this.testId('product-title');
    this.continueButton = this.testId('proceed-1');
  }

  async open(): Promise<void> {
    await this.openCart();
  }

  async expectProductAndQuantity(productName: string, quantity: number): Promise<void> {
    const escapedName = productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exactProductTitle = new RegExp(`^\\s*${escapedName}(?:\\s*-\\s*\\d+%)?\\s*$`);
    const matchingProductTitle = this.productTitle.filter({ hasText: exactProductTitle });
    await expect(matchingProductTitle).toBeVisible();

    // In the cart template, the title's span is inside a table cell; two parent
    // levels up is the row containing the matching quantity input.
    const productRow = matchingProductTitle.locator('xpath=../..');
    await expect(productRow.getByTestId('product-quantity')).toHaveValue(String(quantity));
  }

  async proceedToCheckout(): Promise<void> {
    await this.continueButton.click();
  }
}
