import { APIRequestContext, expect, test } from '@playwright/test';
import { TEST_CARD } from '../../data/payment';
import { STORE_CURRENCY_PREFIX } from '../../data/product';
import { User } from '../../data/user';
import { extractCsrfToken, extractPaymentArtifactIdFromLocation, parseCartProducts } from '../transportHtml';
import {
  PaymentFormSnapshot,
  PaymentRedirectResult,
  PaymentSubmitObservation,
  TransportResponseSnapshot,
  expectCookieValue,
  extractAmountFromPrice,
} from '../apiHelper';

export const purchaseTransportHelper = {
  async captureTransportResponse(
    request: APIRequestContext,
    path: string,
    options?: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      form?: Record<string, string>;
      headers?: Record<string, string>;
      maxRedirects?: number;
    }
  ): Promise<TransportResponseSnapshot> {
    const response = await request.fetch(path, {
      method: options?.method ?? 'GET',
      form: options?.form,
      headers: options?.headers,
      maxRedirects: options?.maxRedirects ?? 0,
    });

    return {
      status: response.status(),
      location: response.headers()['location'] ?? '',
      contentType: response.headers()['content-type'] ?? '',
      body: await response.text(),
    };
  },

  async addProductToCart(request: APIRequestContext, productId: string, cookieHeader: string) {
    return await test.step(`API: Add product ${productId} to cart`, async () => {
      const response = await request.get(`/add_to_cart/${productId}`, {
        headers: {
          Cookie: cookieHeader,
        },
      });

      const body = await response.text();

      expect(response.status()).toBe(200);
      return body;
    });
  },

  async loginViaTransport(request: APIRequestContext, user: User) {
    return await test.step(`Transport: Login user ${user.email}`, async () => {
      const loginPage = await request.get('/login');
      const loginHtml = await loginPage.text();
      const csrfToken = extractCsrfToken(loginHtml);
      const csrfCookie = await expectCookieValue(request, 'csrftoken');

      expect(loginPage.status()).toBe(200);
      expect(csrfCookie.length, 'csrftoken cookie should not be empty').toBeGreaterThan(0);

      const response = await request.post('/login', {
        form: {
          csrfmiddlewaretoken: csrfToken,
          email: user.email,
          password: user.password,
        },
        headers: {
          Origin: process.env.BASE_URL!,
          Referer: `${process.env.BASE_URL}/login`,
        },
        maxRedirects: 0,
      });

      expect(response.status()).toBe(302);
      expect(response.headers()['location']).toBe('/');
      return response;
    });
  },

  async addProductToCartViaTransport(request: APIRequestContext, productId: string) {
    return await test.step(`Transport: Add product ${productId} to cart`, async () => {
      const response = await request.get(`/add_to_cart/${productId}`);
      const body = await response.text();

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type'] ?? '').toContain('text/html');
      expect(body.length).toBeGreaterThan(0);
      return body;
    });
  },

  async openCartViaTransport(request: APIRequestContext) {
    return await test.step('Transport: Open cart document', async () => {
      const response = await request.get('/view_cart');
      const body = await response.text();

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type'] ?? '').toContain('text/html');
      expect(body).toContain('Shopping Cart');
      return body;
    });
  },

  async expectCartContainsProduct(request: APIRequestContext, productId: string, expectedQuantity?: number) {
    return await test.step(`Transport: Verify cart contains product ${productId}`, async () => {
      const cartHtml = await this.openCartViaTransport(request);
      const products = parseCartProducts(cartHtml);
      const product = products.find((item) => item.id === productId);

      expect(product, `Expected product ${productId} to be present in cart`).toBeTruthy();
      if (expectedQuantity !== undefined) {
        expect(product!.quantity).toBe(expectedQuantity);
      }
      return {
        cartHtml,
        product: product!,
        products,
      };
    });
  },

  async deleteProductFromCartViaTransport(request: APIRequestContext, productId: string) {
    return await test.step(`Transport: Delete product ${productId} from cart`, async () => {
      const response = await request.get(`/delete_cart/${productId}`);
      const body = await response.text();

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type'] ?? '').toContain('text/html');
      return body;
    });
  },

  async expectCartDoesNotContainProduct(request: APIRequestContext, productId: string) {
    return await test.step(`Transport: Verify cart does not contain product ${productId}`, async () => {
      const cartHtml = await this.openCartViaTransport(request);
      const products = parseCartProducts(cartHtml);
      const product = products.find((item) => item.id === productId);

      expect(product, `Expected product ${productId} to be absent from cart`).toBeFalsy();
      return {
        cartHtml,
        products,
      };
    });
  },

  async openCheckoutViaTransport(request: APIRequestContext) {
    return await test.step('Transport: Open checkout document', async () => {
      const response = await request.get('/checkout');
      const body = await response.text();

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type'] ?? '').toContain('text/html');
      expect(body).toContain('Address Details');
      return body;
    });
  },

  async expectCheckoutContainsAmount(request: APIRequestContext, expectedAmount: string) {
    return await test.step(`Transport: Verify checkout contains amount ${expectedAmount}`, async () => {
      const checkoutHtml = await this.openCheckoutViaTransport(request);

      expect(checkoutHtml).toContain(`${STORE_CURRENCY_PREFIX} ${expectedAmount}`);
      return checkoutHtml;
    });
  },

  async openPaymentViaTransport(request: APIRequestContext) {
    return await test.step('Transport: Open payment document', async () => {
      const response = await request.get('/payment');
      const body = await response.text();

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type'] ?? '').toContain('text/html');
      expect(body).toContain('Payment');
      expect(body).toContain('csrfmiddlewaretoken');
      return body;
    });
  },

  async openPaymentFormSnapshot(request: APIRequestContext): Promise<PaymentFormSnapshot> {
    return await test.step('Transport: Open payment form and capture CSRF token', async () => {
      const response = await request.get('/payment');
      const body = await response.text();

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type'] ?? '').toContain('text/html');
      expect(body).toContain('Payment');
      expect(body).toContain('csrfmiddlewaretoken');

      return {
        status: response.status(),
        location: response.headers()['location'] ?? '',
        contentType: response.headers()['content-type'] ?? '',
        body,
        csrfToken: extractCsrfToken(body),
      };
    });
  },

  async submitPaymentViaTransport(request: APIRequestContext): Promise<PaymentRedirectResult> {
    return await test.step('Transport: Submit payment and capture redirect', async () => {
      const paymentPage = await request.get('/payment');
      const paymentHtml = await paymentPage.text();
      const csrfToken = extractCsrfToken(paymentHtml);
      const csrfCookie = await expectCookieValue(request, 'csrftoken');

      expect(paymentPage.status()).toBe(200);
      expect(csrfCookie.length, 'csrftoken cookie should not be empty before payment submit').toBeGreaterThan(0);

      const response = await request.post('/payment', {
        form: {
          csrfmiddlewaretoken: csrfToken,
          name_on_card: TEST_CARD.holder,
          card_number: TEST_CARD.number,
          cvc: TEST_CARD.cvc,
          expiry_month: TEST_CARD.expiryMonth,
          expiry_year: TEST_CARD.expiryYear,
        },
        headers: {
          Origin: process.env.BASE_URL!,
          Referer: `${process.env.BASE_URL}/payment`,
        },
        maxRedirects: 0,
      });

      expect(response.status()).toBe(302);

      const location = response.headers()['location'] ?? '';
      const paymentArtifactId = extractPaymentArtifactIdFromLocation(location);

      return {
        location,
        paymentArtifactId,
      };
    });
  },

  async submitPaymentWithCsrfTokenRaw(
    request: APIRequestContext,
    csrfToken: string
  ): Promise<PaymentSubmitObservation> {
    return await test.step('Transport: Submit payment with provided CSRF token', async () => {
      const response = await request.post('/payment', {
        form: {
          csrfmiddlewaretoken: csrfToken,
          name_on_card: TEST_CARD.holder,
          card_number: TEST_CARD.number,
          cvc: TEST_CARD.cvc,
          expiry_month: TEST_CARD.expiryMonth,
          expiry_year: TEST_CARD.expiryYear,
        },
        headers: {
          Origin: process.env.BASE_URL!,
          Referer: `${process.env.BASE_URL}/payment`,
        },
        maxRedirects: 0,
      });

      const location = response.headers()['location'] ?? '';

      return {
        status: response.status(),
        location,
        contentType: response.headers()['content-type'] ?? '',
        body: await response.text(),
        paymentArtifactId: /\/payment_done\/\d+/.test(location) ? extractPaymentArtifactIdFromLocation(location) : null,
      };
    });
  },

  async submitPaymentViaTransportRaw(request: APIRequestContext): Promise<TransportResponseSnapshot> {
    return await test.step('Transport: Submit payment without happy-path assumptions', async () => {
      const paymentPage = await request.get('/payment');
      const paymentHtml = await paymentPage.text();
      const csrfToken = extractCsrfToken(paymentHtml);

      return await this.captureTransportResponse(request, '/payment', {
        method: 'POST',
        form: {
          csrfmiddlewaretoken: csrfToken,
          name_on_card: TEST_CARD.holder,
          card_number: TEST_CARD.number,
          cvc: TEST_CARD.cvc,
          expiry_month: TEST_CARD.expiryMonth,
          expiry_year: TEST_CARD.expiryYear,
        },
        headers: {
          Origin: process.env.BASE_URL!,
          Referer: `${process.env.BASE_URL}/payment`,
        },
      });
    });
  },

  async openPaymentDoneViaTransport(request: APIRequestContext, paymentArtifactId: string) {
    return await test.step(`Transport: Open payment_done artifact ${paymentArtifactId}`, async () => {
      const response = await request.get(`/payment_done/${paymentArtifactId}`);
      const body = await response.text();

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type'] ?? '').toContain('text/html');
      expect(body).toContain('Order Placed!');
      return body;
    });
  },

  async logoutViaTransport(request: APIRequestContext) {
    return await test.step('Transport: Logout user', async () => {
      const response = await request.get('/logout', {
        maxRedirects: 0,
      });

      expect(response.status()).toBe(302);
      expect(response.headers()['location']).toBe('/login');

      const homeResponse = await request.get('/');
      const homeHtml = await homeResponse.text();

      expect(homeResponse.status()).toBe(200);
      expect(homeHtml).toContain('Signup / Login');
      expect(homeHtml).not.toContain('Logged in as');

      return response;
    });
  },

  async downloadInvoiceViaTransport(request: APIRequestContext, paymentArtifactId: string, expectedAmount?: string) {
    return await test.step(`Transport: Download invoice for payment artifact ${paymentArtifactId}`, async () => {
      const response = await request.get(`/download_invoice/${paymentArtifactId}`);
      const body = await response.text();

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type'] ?? '').toContain('text/plain');
      expect(body).toContain('Your total purchase amount is');
      if (expectedAmount) {
        expect(body).toContain(`Your total purchase amount is ${expectedAmount}`);
      }
      return body;
    });
  },

  async getExpectedInvoiceAmountForProduct(request: APIRequestContext, productId: string): Promise<string> {
    return await test.step(`API: Get expected invoice amount for product ${productId}`, async () => {
      const product = await this.getProductById(request, productId);
      return extractAmountFromPrice(product.price);
    });
  },
};
