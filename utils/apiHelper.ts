import { APIRequestContext, expect } from '@playwright/test';
import { accountApiHelper } from './api/accountApiHelper';
import { catalogApiHelper } from './api/catalogApiHelper';
import { purchaseTransportHelper } from './api/purchaseTransportHelper';

export type PaymentRedirectResult = {
  location: string;
  paymentArtifactId: string;
};

export type PaymentFormSnapshot = TransportResponseSnapshot & {
  csrfToken: string | null;
};

export type PaymentSubmitObservation = TransportResponseSnapshot & {
  paymentArtifactId: string | null;
};

export type TransportResponseSnapshot = {
  status: number;
  location: string;
  contentType: string;
  body: string;
};

export function extractAmountFromPrice(price: string): string {
  const match = price.match(/(\d+)/);

  expect(price, 'Expected product price to contain a numeric amount').toMatch(/\d+/);
  return match![1];
}

export async function expectCookieValue(request: APIRequestContext, cookieName: string): Promise<string> {
  const storage = await request.storageState();
  const cookie = storage.cookies.find((item) => item.name === cookieName);

  expect(cookie, `Expected "${cookieName}" cookie to be present in request context`).toBeTruthy();
  return cookie!.value;
}

export const apiHelper = {
  ...accountApiHelper,
  ...catalogApiHelper,
  ...purchaseTransportHelper,
};
