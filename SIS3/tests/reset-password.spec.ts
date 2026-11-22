import { test } from '../fixtures/pages.fixture';
import { unknownCustomerEmail } from '../data/user.factory';

test('known email receives reset confirmation and an unknown email is rejected', async ({
  forgotPasswordPage,
  freshCustomer: customer,
}) => {
  await forgotPasswordPage.open();
  await forgotPasswordPage.requestReset(customer.email);
  await forgotPasswordPage.expectRequestConfirmation();

  await forgotPasswordPage.open();
  await forgotPasswordPage.requestReset(unknownCustomerEmail());
  await forgotPasswordPage.expectInvalidEmailError();
});
