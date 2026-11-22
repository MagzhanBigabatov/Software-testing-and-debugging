import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';

export interface ProductSnapshot {
  name: string;
  priceText: string;
  price: number;
}

export interface ProductComparison {
  first: ProductSnapshot;
  second: ProductSnapshot;
  cheaperProduct: string | 'same price';
}

export class ProductPage extends BasePage {
  private readonly productName: Locator;
  private readonly unitPrice: Locator;
  private readonly addToCartButton: Locator;

  constructor(page: Page) {
    super(page);
    this.productName = this.testId('product-name');
    this.unitPrice = this.testId('unit-price').or(this.testId('product-price'));
    this.addToCartButton = this.testId('add-to-cart');
  }

  /**
   * Open the product at a 1-based position in the current catalog results.
   * The site's data-test product IDs are based on database IDs, not positions,
   * so select the catalog cards by their shared data-test prefix instead.
   */
  async openCatalogProduct(index: number): Promise<void> {
    if (!Number.isInteger(index) || index < 1) {
      throw new Error(`Product index must be a positive integer, received: ${index}`);
    }

    await this.navigate('/');
    const productCards = this.catalogProductCards();
    const card = productCards.nth(index - 1);
    await expect(card).toBeVisible();
    await card.click();
    await this.expectProductDetailsVisible();
  }

  /** Select the first in-stock catalog card; useful for a purchase flow. */
  async openFirstAvailableCatalogProduct(): Promise<void> {
    await this.navigate('/');
    const productCards = this.catalogProductCards();
    await expect(productCards.first()).toBeVisible();

    const cardCount = await productCards.count();
    for (let index = 0; index < cardCount; index += 1) {
      const card = productCards.nth(index);
      const outOfStockBadge = card.getByTestId('out-of-stock');
      if (await outOfStockBadge.count() === 0) {
        await card.click();
        await this.expectProductDetailsVisible();
        return;
      }
    }

    throw new Error('No in-stock products were found on the first catalog page.');
  }

  private catalogProductCards(): Locator {
    // Each catalog card is an anchor with data-test="product-<database id>".
    return this.page.locator('a[data-test^="product-"]');
  }

  private async expectProductDetailsVisible(): Promise<void> {
    await expect(this.productName).toBeVisible();
    await expect(this.unitPrice).toBeVisible();
  }

  async readCurrentProduct(): Promise<ProductSnapshot> {
    const name = (await this.productName.innerText()).trim();
    const priceText = (await this.unitPrice.innerText()).trim();
    const numericPrice = Number(priceText.replace(/[^\d.,-]/g, '').replace(',', '.'));

    if (!name) {
      throw new Error('The product detail page displayed an empty product name.');
    }
    if (!Number.isFinite(numericPrice)) {
      throw new Error(`Could not parse product price: "${priceText}"`);
    }

    return { name, priceText, price: numericPrice };
  }

  async addToCart(): Promise<void> {
    // The cart page assertion verifies the actual outcome instead of relying on a toast.
    await this.addToCartButton.click();
  }

  async compareCatalogProducts(firstIndex = 1, secondIndex = 2): Promise<ProductComparison> {
    if (firstIndex === secondIndex) {
      throw new Error('Choose two different product indexes for comparison.');
    }

    await this.openCatalogProduct(firstIndex);
    const first = await this.readCurrentProduct();

    await this.openCatalogProduct(secondIndex);
    const second = await this.readCurrentProduct();

    const cheaperProduct = first.price < second.price
      ? first.name
      : second.price < first.price
        ? second.name
        : 'same price';

    return { first, second, cheaperProduct };
  }

  async expectComparisonIsValid(comparison: ProductComparison): Promise<void> {
    expect(comparison.first.name).not.toBe(comparison.second.name);
    expect(comparison.first.price).toBeGreaterThan(0);
    expect(comparison.second.price).toBeGreaterThan(0);

    const expectedCheaperProduct = comparison.first.price < comparison.second.price
      ? comparison.first.name
      : comparison.second.price < comparison.first.price
        ? comparison.second.name
        : 'same price';
    expect(comparison.cheaperProduct).toBe(expectedCheaperProduct);
  }
}
