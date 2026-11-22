import { test } from '../fixtures/pages.fixture';
import { unknownCustomerEmail } from '../data/user.factory';

test('valid customer credentials reach the account page', async ({ loginPage, freshCustomer: customer }) => {
  await loginPage.open();
  await loginPage.signIn(customer.email, customer.password);
  await loginPage.expectAccountPage();
});

test('invalid credentials show an error and do not sign in', async ({ loginPage }) => {
  await loginPage.open();
  await loginPage.signIn(unknownCustomerEmail(), 'DefinitelyWrong123!');
  await loginPage.expectInvalidLogin();
});
