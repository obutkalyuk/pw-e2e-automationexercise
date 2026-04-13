import { expect } from '@playwright/test';
import { test } from '../../../utils/fixtures';
import { apiHelper } from '../../../utils/apiHelper';

test.describe('Broken Purchase Chain Coverage', () => {
  test('[API-19][TR-10] Checkout without login should not expose an active checkout step @critical', async ({ request }) => {
    test.fail(true, 'Known defect (#17): anonymous checkout is reachable and renders checkout content instead of gating the flow.');

    const productId = '1';

    await apiHelper.addProductToCartViaTransport(request, productId);
    const cartResult = await apiHelper.expectCartContainsProduct(request, productId, 1);
    const checkoutResponse = await apiHelper.captureTransportResponse(request, '/checkout');

    expect(checkoutResponse.status).toBe(302);
    expect(checkoutResponse.location).toMatch(/\/login/);
    expect(checkoutResponse.body).not.toContain('Address Details');
    expect(checkoutResponse.body).not.toContain('Review Your Order');
    expect(checkoutResponse.body).not.toContain('Proceed To Payment');
    expect(checkoutResponse.body).not.toContain('csrfmiddlewaretoken');
    expect(checkoutResponse.body).not.toMatch(/payment_done\/\d+/);
    expect(cartResult.product.quantity).toBe(1);
  });

  test('[API-20][TR-11] Payment without checkout should not create an order @critical', async ({ request, managedUser }) => {
    test.fail(true, 'Known defect (#18): payment submission succeeds without a checkout transition and creates an order-completion artifact.');

    const productId = '1';

    await apiHelper.loginViaTransport(request, managedUser);
    await apiHelper.addProductToCartViaTransport(request, productId);

    const paymentPage = await apiHelper.captureTransportResponse(request, '/payment');
    const paymentSubmit = await apiHelper.submitPaymentViaTransportRaw(request);

    expect(paymentPage.status).toBe(302);
    expect(paymentPage.location).toMatch(/\/checkout|\/view_cart/);
    expect(paymentPage.body).not.toContain('Payment');
    expect(paymentPage.body).not.toContain('csrfmiddlewaretoken');
    expect(paymentSubmit.status).not.toBe(302);
    expect(paymentSubmit.location).toBe('');
    expect(paymentSubmit.location).not.toMatch(/\/payment_done\/\d+/);
  });

  test('[API-21][TR-12] Checkout after logout should invalidate the previous checkout state @high', async ({ request, managedUser }) => {
    test.fail(true, 'Known defect (#19): checkout remains directly accessible after logout and still renders checkout content.');

    const productId = '1';

    await apiHelper.loginViaTransport(request, managedUser);
    await apiHelper.addProductToCartViaTransport(request, productId);
    await apiHelper.openCheckoutViaTransport(request);
    await apiHelper.logoutViaTransport(request);

    const checkoutAfterLogout = await apiHelper.captureTransportResponse(request, '/checkout');
    const paymentAfterLogout = await apiHelper.captureTransportResponse(request, '/payment');

    expect(checkoutAfterLogout.status).toBe(302);
    expect(checkoutAfterLogout.location).toMatch(/\/login/);
    expect(checkoutAfterLogout.body).not.toContain('Address Details');
    expect(checkoutAfterLogout.body).not.toContain('Review Your Order');
    expect(paymentAfterLogout.status).toBe(302);
    expect(paymentAfterLogout.location).toMatch(/\/login|\/view_cart|\/checkout/);
    expect(paymentAfterLogout.body).not.toContain('Payment');
  });

  test('[API-22][TR-13] Payment without login should not create a success artifact @critical', async ({ request }) => {
    test.fail(true, 'Known defect (#20): anonymous payment submission creates payment_done/0 instead of blocking the transition.');

    const productId = '1';

    await apiHelper.addProductToCartViaTransport(request, productId);
    const paymentPage = await apiHelper.captureTransportResponse(request, '/payment');
    const paymentSubmit = await apiHelper.submitPaymentViaTransportRaw(request);

    expect(paymentPage.status).toBe(302);
    expect(paymentPage.location).toMatch(/\/login/);
    expect(paymentPage.body).not.toContain('Payment');
    expect(paymentPage.body).not.toContain('csrfmiddlewaretoken');
    expect(paymentSubmit.status).not.toBe(302);
    expect(paymentSubmit.location).toBe('');
    expect(paymentSubmit.location).not.toBe('/payment_done/0');
    expect(paymentSubmit.location).not.toMatch(/\/payment_done\/\d+/);
  });
});
