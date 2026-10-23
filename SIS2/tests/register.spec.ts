import { test } from '../fixtures/pages.fixture';
import { createUniqueUser } from '../data/user.factory';

test('register a unique customer account', async ({ registerPage }) => {
  const newCustomer = createUniqueUser();

  await registerPage.open();
  await registerPage.register(newCustomer);
  await registerPage.expectRegistrationOutcome();
});
