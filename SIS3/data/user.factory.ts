import { randomUUID } from 'node:crypto';

export interface CustomerCredentials {
  email: string;
  password: string;
}

export interface RegistrationUser extends CustomerCredentials {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  street: string;
  postalCode: string;
  houseNumber: string;
  countryCode: string;
  city: string;
  state: string;
  phone: string;
}

export interface BillingAddress {
  street: string;
  postalCode: string;
  houseNumber: string;
  city: string;
  state: string;
  countryCode: string;
}

/** Generate a fresh email for each registration test/run to avoid duplicates. */
export function createUniqueUser(): RegistrationUser {
  const token = randomUUID().replaceAll('-', '').slice(0, 12);
  const suffix = token.slice(-8);
  const phoneSuffix = String(Number.parseInt(token.slice(0, 8), 16) % 10_000_000).padStart(7, '0');

  return {
    firstName: 'Playwright',
    lastName: `Customer${suffix}`,
    dateOfBirth: '1990-01-15',
    street: '100 Test Avenue',
    postalCode: '90001',
    houseNumber: '42',
    city: 'Los Angeles',
    state: 'California',
    countryCode: 'US',
    phone: `555${phoneSuffix}`,
    email: `playwright.${token}@example.com`,
    // Random per run, but short: the login form rejects passwords longer than ~40 chars.
    password: `Pw!${randomUUID().replaceAll("-", "").slice(0, 12)}aA1`,
  };
}

/** A syntactically valid address that should not belong to a registered user. */
export function unknownCustomerEmail(): string {
  return `unknown.${randomUUID().replaceAll('-', '').slice(0, 12)}@example.com`;
}

export function testBillingAddress(): BillingAddress {
  return {
    street: '100 Test Avenue',
    postalCode: '90001',
    houseNumber: '42',
    city: 'Los Angeles',
    state: 'California',
    countryCode: 'US',
  };
}
