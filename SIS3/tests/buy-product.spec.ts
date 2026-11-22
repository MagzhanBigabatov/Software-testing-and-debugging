import { test } from '../fixtures/pages.fixture';
import { testBillingAddress } from '../data/user.factory';

test('add a product to the cart and complete checkout', async ({
  loginPage,
  productPage,
  cartPage,
  checkoutPage,
  freshCustomer: customer,
}) => {
  await loginPage.open();
  await loginPage.signIn(customer.email, customer.password);
  await loginPage.expectAccountPage();

  await productPage.openFirstAvailableCatalogProduct();
  const product = await productPage.readCurrentProduct();
  await productPage.addToCart();

  await cartPage.open();
  await cartPage.expectProductAndQuantity(product.name, 1);
  await cartPage.proceedToCheckout();

  await checkoutPage.completePurchase(testBillingAddress());
});
