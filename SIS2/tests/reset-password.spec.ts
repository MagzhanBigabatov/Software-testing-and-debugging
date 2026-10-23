import { test } from '../fixtures/pages.fixture';
import { knownCustomer, unknownCustomerEmail } from '../data/user.factory';

test('known email receives reset confirmation and an unknown email is rejected', async ({
  forgotPasswordPage,
}) => {
  const customer = knownCustomer();

  await forgotPasswordPage.open();
  await forgotPasswordPage.requestReset(customer.email);
  await forgotPasswordPage.expectRequestConfirmation();

  await forgotPasswordPage.open();
  await forgotPasswordPage.requestReset(unknownCustomerEmail());
  await forgotPasswordPage.expectInvalidEmailError();
});
