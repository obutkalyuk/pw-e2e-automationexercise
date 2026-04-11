import { APIRequestContext, expect, test, TestInfo } from '@playwright/test';
import { TEST_CARD } from '../data/payment';
import { ProductApiModel, STORE_CURRENCY_PREFIX } from '../data/product';
import { User } from '../data/user';

type PaymentRedirectResult = {
  location: string;
  orderId: string;
};

type TransportCartProduct = {
  id: string;
  name: string;
  price: string;
  quantity: number;
  total: string;
};

function extractAmountFromPrice(price: string): string {
  const match = price.match(/(\d+)/);

  expect(price, 'Expected product price to contain a numeric amount').toMatch(/\d+/);
  return match![1];
}

function extractCsrfToken(html: string): string {
  const match = html.match(/name=["']csrfmiddlewaretoken["']\s+value=["']([^"']+)["']/i);

  expect(match, 'CSRF token was not found in HTML response').not.toBeNull();
  return match![1];
}

function extractOrderIdFromLocation(location: string): string {
  const match = location.match(/\/payment_done\/(\d+)/);

  expect(location, 'Payment redirect location should contain order id').toMatch(/\/payment_done\/\d+/);
  return match![1];
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseCartProducts(html: string): TransportCartProduct[] {
  const products: TransportCartProduct[] = [];
  const rowPattern = /<tr[^>]+id=["']product-(\d+)["'][\s\S]*?<\/tr>/gi;

  for (const rowMatch of html.matchAll(rowPattern)) {
    const rowHtml = rowMatch[0];
    const id = rowMatch[1];
    const nameMatch = rowHtml.match(/class=["'][^"']*cart_description[^"']*["'][\s\S]*?<h4>\s*<a[^>]*>([\s\S]*?)<\/a>/i);
    const priceMatch = rowHtml.match(/class=["'][^"']*cart_price[^"']*["'][\s\S]*?<p>([\s\S]*?)<\/p>/i);
    const quantityMatch = rowHtml.match(/class=["'][^"']*cart_quantity[^"']*["'][\s\S]*?<button[^>]*>(\d+)<\/button>/i);
    const totalMatch = rowHtml.match(/class=["'][^"']*cart_total_price[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);

    expect(nameMatch, `Expected cart row for product ${id} to contain product name`).toBeTruthy();
    expect(priceMatch, `Expected cart row for product ${id} to contain product price`).toBeTruthy();
    expect(quantityMatch, `Expected cart row for product ${id} to contain product quantity`).toBeTruthy();
    expect(totalMatch, `Expected cart row for product ${id} to contain product total`).toBeTruthy();

    products.push({
      id,
      name: stripHtml(nameMatch![1]),
      price: stripHtml(priceMatch![1]),
      quantity: Number(quantityMatch![1]),
      total: stripHtml(totalMatch![1]),
    });
  }

  return products;
}

async function expectCookieValue(request: APIRequestContext, cookieName: string): Promise<string> {
  const storage = await request.storageState();
  const cookie = storage.cookies.find((item) => item.name === cookieName);

  expect(cookie, `Expected "${cookieName}" cookie to be present in request context`).toBeTruthy();
  return cookie!.value;
}

export const apiHelper = {
 
  async createUser(request: APIRequestContext, user: User) {
    return await test.step(`API: Create user ${user.email}`, async () => {
      const response = await request.post('/api/createAccount', {
        form: user.toApiForm(),
      });
      
      const body = await response.json();
      
      expect(response.status()).toBe(200);
      expect(body.responseCode, `Creation failed for ${user.email}: ${body.message}`).toBe(201);
      return body;
    });
  },

  /**
 * BUG ALERT: AutomationExercise API always returns HTTP 200 even for failed DELETE requests.
 * We must check the 'responseCode' inside the JSON body instead of response.ok().
 * See GitHub Issue #1 (https://github.com/obutkalyuk/pw-e2e-automationexercise/issues/1) for details.
 */
  async deleteUser(request: APIRequestContext, user: User) {
    return await test.step(`API: Delete user ${user.email}`, async () => {
      const response = await request.delete('/api/deleteAccount', {
        form: {
          email: user.email,
          password: user.password
        }
      });
      
      const body = await response.json();
      
      expect(response.status()).toBe(200);
      expect(body.responseCode, `Deletion failed for ${user.email}: ${body.message}`).toBe(200);
      return body;
    });
  },

  async createManagedUser(request: APIRequestContext, testInfo: TestInfo): Promise<User> {
    const user = User.generateRandom();
    await this.createUser(request, user);
    testInfo.annotations.push({
      type: 'Test Data',
      description: `Name: ${user.name} | Email: ${user.email} | Password: ${user.password}`
    });
    return user;
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
      const orderId = extractOrderIdFromLocation(location);

      return {
        location,
        orderId,
      };
    });
  },

  async openPaymentDoneViaTransport(request: APIRequestContext, orderId: string) {
    return await test.step(`Transport: Open payment_done for order ${orderId}`, async () => {
      const response = await request.get(`/payment_done/${orderId}`);
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

  async downloadInvoiceViaTransport(request: APIRequestContext, orderId: string, expectedAmount?: string) {
    return await test.step(`Transport: Download invoice for order ${orderId}`, async () => {
      const response = await request.get(`/download_invoice/${orderId}`);
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

  async getProductById(request: APIRequestContext, productId: string): Promise<ProductApiModel> {
    return await test.step(`API: Get product ${productId} from products list`, async () => {
      const products = await this.getProductsList(request);
      const product = products.find((item) => String(item.id) === productId);

      expect(product, `Product ${productId} should exist in products list`).toBeTruthy();
      return product!;
    });
  },

  async getProductsList(request: APIRequestContext): Promise<ProductApiModel[]> {
    return await test.step('API: Get products list', async () => {
      const response = await request.get('/api/productsList');
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.responseCode).toBe(200);

      return body.products as ProductApiModel[];
    });
  },

  async deleteUserIfExists(request: APIRequestContext, user?: User) {
    if (!user) {
      return;
    }

    await test.step(`API: Delete user if exists ${user.email}`, async () => {
      const response = await request.delete('/api/deleteAccount', {
        form: {
          email: user.email,
          password: user.password
        }
      });
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(
        [200, 404],
        `Unexpected deletion response for ${user.email}: ${body.message}`
      ).toContain(body.responseCode);
    });
  }
};
