import { test } from '../fixtures/pages.fixture';

test('compare names and prices of two products', async ({ productPage }) => {
  const comparison = await productPage.compareCatalogProducts(1, 2);

  // The Page Object captures product name/price and verifies the stated comparison.
  await productPage.expectComparisonIsValid(comparison);
});
