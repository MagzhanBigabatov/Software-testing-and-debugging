import { test } from '../fixtures/pages.fixture';
import { testBillingAddress } from '../data/user.factory';

test('add a product to the cart and complete checkout', async ({
  productPage,
  cartPage,
  checkoutPage,
  freshCustomer: customer,
}) => {
  // Like a real shopper: pick a product as a guest, then sign in at checkout.
  // Only the catalog is opened by URL; everything after that is done by clicks
  // inside the single-page app.
  await productPage.openFirstAvailableCatalogProduct();
  const product = await productPage.readCurrentProduct();
  await productPage.addToCart();

  await cartPage.open();
  await cartPage.expectProductAndQuantity(product.name, 1);
  await cartPage.proceedToCheckout();

  await checkoutPage.signInAtCheckout(customer);
  await checkoutPage.completePurchase(testBillingAddress());
});
