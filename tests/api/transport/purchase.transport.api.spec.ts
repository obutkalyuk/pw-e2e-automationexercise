import { expect } from '@playwright/test';
import { test } from '../../../utils/fixtures';
import { apiHelper } from '../../../utils/apiHelper';
import { extractInvoiceAmount } from '../../../utils/transportHtml';

test.describe('Transport Request Coverage', () => {
  test('[TR-1] POST /login - authenticate user via transport flow @high', async ({
    request,
    managedUser,
  }) => {
    await apiHelper.loginViaTransport(request, managedUser);
  });

  test('[TR-7] GET /logout - invalidate session and redirect to login @medium', async ({
    request,
    managedUser,
  }) => {
    await apiHelper.loginViaTransport(request, managedUser);
    await apiHelper.logoutViaTransport(request);
  });

  test('[TR-8] GET /view_cart - open cart document for active cart session @high', async ({
    request,
    managedUser,
  }) => {
    const productId = '1';
    const product = await apiHelper.getProductById(request, productId);

    await apiHelper.loginViaTransport(request, managedUser);
    await apiHelper.addProductToCartViaTransport(request, productId);

    const cartResult = await apiHelper.expectCartContainsProduct(request, productId, 1);

    expect(cartResult.product.name).toBe(product.name);
    expect(cartResult.product.price).toBe(product.price);
  });

  test('[TR-9] GET /delete_cart/{product_id} - remove full cart row for repeated product @high', async ({
    request,
    managedUser,
  }) => {
    const productId = '1';

    await apiHelper.loginViaTransport(request, managedUser);
    await apiHelper.addProductToCartViaTransport(request, productId);
    await apiHelper.addProductToCartViaTransport(request, productId);

    await apiHelper.expectCartContainsProduct(request, productId, 2);
    await apiHelper.deleteProductFromCartViaTransport(request, productId);
    await apiHelper.expectCartDoesNotContainProduct(request, productId);
  });

  test('[TR-2][TR-3][TR-4] active session cart -> checkout -> payment document flow @high', async ({
    request,
    managedUser,
  }) => {
    await apiHelper.loginViaTransport(request, managedUser);

    // TR-2: add product to cart and verify it is present in the active session cart.
    await apiHelper.addProductToCartViaTransport(request, '1');
    await apiHelper.expectCartContainsProduct(request, '1', 1);

    // TR-3: verify the checkout document is reachable for the active cart session.
    await apiHelper.openCheckoutViaTransport(request);

    // TR-4: verify the payment document is reachable after checkout.
    await apiHelper.openPaymentViaTransport(request);
  });

  test('[TR-5] POST /payment - submit payment and verify redirect to order completion @critical', async ({
    request,
    managedUser,
  }) => {
    await apiHelper.loginViaTransport(request, managedUser);
    await apiHelper.addProductToCartViaTransport(request, '1');
    await apiHelper.openCheckoutViaTransport(request);

    const paymentResult = await apiHelper.submitPaymentViaTransport(request);

    await apiHelper.openPaymentDoneViaTransport(request, paymentResult.paymentArtifactId);
  });

  test('[TR-6] GET /download_invoice/{value} - download invoice after successful purchase @medium', async ({
    request,
    managedUser,
  }) => {
    const productId = '1';
    const expectedAmount = await apiHelper.getExpectedInvoiceAmountForProduct(request, productId);

    await apiHelper.loginViaTransport(request, managedUser);
    await apiHelper.addProductToCartViaTransport(request, productId);
    await apiHelper.openCheckoutViaTransport(request);

    const paymentResult = await apiHelper.submitPaymentViaTransport(request);
    const invoiceBody = await apiHelper.downloadInvoiceViaTransport(
      request,
      paymentResult.paymentArtifactId,
      expectedAmount,
    );
    const invoiceAmount = extractInvoiceAmount(invoiceBody);

    expect(invoiceAmount).toBe(expectedAmount);
  });
});
