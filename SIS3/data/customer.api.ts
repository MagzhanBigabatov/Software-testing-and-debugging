import { expect, type APIRequestContext } from '@playwright/test';
import { createUniqueUser, type CustomerCredentials, type RegistrationUser } from './user.factory';

// `||` so an empty value (e.g. an unset CI variable) falls back to the default.
const apiURL = () => process.env.API_URL || 'https://api.practicesoftwaretesting.com';

/**
 * Register a brand-new customer through the site's REST API and return its
 * credentials. Every test that needs a signed-in user gets its own account, so
 * tests never share (or lock, or reset the password of) one demo account and
 * can safely run in parallel CI shards.
 */
export async function registerCustomerViaApi(
  request: APIRequestContext,
  user: RegistrationUser = createUniqueUser(),
): Promise<CustomerCredentials> {
  // Use the site's own postcode lookup for the profile address. The checkout
  // pre-fills the billing form from the profile and the invoice API rejects any
  // address that differs from the lookup, so both must be the same address.
  const lookup = await request.get(`${apiURL()}/postcode-lookup`, {
    params: { country: user.countryCode, postcode: user.postalCode, house_number: user.houseNumber },
  });
  if (lookup.ok()) {
    const found = await lookup.json() as { street?: string; city?: string; state?: string };
    user = {
      ...user,
      street: found.street || user.street,
      city: found.city || user.city,
      state: found.state || user.state,
    };
  }

  const response = await request.post(`${apiURL()}/users/register`, {
    data: {
      first_name: user.firstName,
      last_name: user.lastName,
      dob: user.dateOfBirth,
      phone: user.phone,
      email: user.email,
      password: user.password,
      address: {
        street: user.street,
        house_number: user.houseNumber,
        city: user.city,
        state: user.state,
        country: user.countryCode,
        postal_code: user.postalCode,
      },
    },
  });

  expect(response.status(), `API registration failed: ${await response.text()}`).toBe(201);
  return { email: user.email, password: user.password };
}
