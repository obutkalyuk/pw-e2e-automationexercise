import { expect } from '@playwright/test';
import { TEST_CARD } from '../../../data/payment.data';
import { test } from '../../../utils/fixtures';
import { apiHelper } from '../../../utils/api-helper';

test.describe('Deleted Account Session Coverage', () => {
  test('[API-26][TR-17] Checkout and payment should reject a stale session after account deletion @critical', async ({
    request,
    managedUser,
  }, testInfo) => {
    test.fail(
      true,
      'Known defect (#46): a session remains checkout/payment-capable after its user account is deleted via API.',
    );

    const productId = '1';

    await apiHelper.loginViaTransport(request, managedUser);
    await apiHelper.addProductToCartViaTransport(request, productId);
    await apiHelper.expectCartContainsProduct(request, productId, 1);
    await apiHelper.deleteUser(request, managedUser);

    const checkoutAfterAccountDelete = await apiHelper.captureTransportResponse(
      request,
      '/checkout',
    );
    const paymentAfterAccountDelete = await apiHelper.captureTransportResponse(request, '/payment');
    const paymentSubmitAfterAccountDelete = await apiHelper.captureTransportResponse(
      request,
      '/payment',
      {
        method: 'POST',
        form: {
          csrfmiddlewaretoken: 'stale-deleted-account-session',
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
      },
    );

    expect(checkoutAfterAccountDelete.status).toBe(302);
    expect(checkoutAfterAccountDelete.location).toMatch(/\/login/);
    expect(checkoutAfterAccountDelete.body).not.toContain('Address Details');
    expect(checkoutAfterAccountDelete.body).not.toContain('Review Your Order');
    expect(checkoutAfterAccountDelete.body).not.toContain('Proceed To Payment');

    expect(paymentAfterAccountDelete.status).toBe(302);
    expect(paymentAfterAccountDelete.location).toMatch(/\/login|\/view_cart|\/checkout/);
    expect(paymentAfterAccountDelete.body).not.toContain('Payment');
    expect(paymentAfterAccountDelete.body).not.toContain('csrfmiddlewaretoken');

    expect(paymentSubmitAfterAccountDelete.status).not.toBe(302);
    expect(paymentSubmitAfterAccountDelete.location).not.toBe('/payment_done/0');
    expect(paymentSubmitAfterAccountDelete.location).not.toMatch(/\/payment_done\/\d+/);

    testInfo.annotations.push({
      type: 'Finding',
      description: [
        `checkout=${checkoutAfterAccountDelete.status}:${checkoutAfterAccountDelete.location || '<no-location>'}`,
        `payment=${paymentAfterAccountDelete.status}:${paymentAfterAccountDelete.location || '<no-location>'}`,
        `paymentSubmit=${paymentSubmitAfterAccountDelete.status}:${paymentSubmitAfterAccountDelete.location || '<no-location>'}`,
      ].join(' | '),
    });
  });
});
