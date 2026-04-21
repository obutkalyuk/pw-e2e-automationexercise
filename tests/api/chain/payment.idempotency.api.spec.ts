import { expect } from '@playwright/test';
import { test } from '../../../utils/fixtures';
import { apiHelper } from '../../../utils/apiHelper';

test.describe('Payment Idempotency Coverage', () => {
  test('[API-23][TR-14] Repeated payment submit in one session should preserve consistent completion artifacts @high', async ({
    request,
    managedUser,
  }, testInfo) => {
    test.fail(
      true,
      'Known defect (#22): /payment exposes an amount-derived payment artifact value and replay after cart reset yields payment_done/0 with invoice access.',
    );

    const productId = '1';
    const expectedAmount = await apiHelper.getExpectedInvoiceAmountForProduct(request, productId);

    await apiHelper.loginViaTransport(request, managedUser);
    await apiHelper.addProductToCartViaTransport(request, productId);
    await apiHelper.expectCheckoutContainsAmount(request, expectedAmount);

    const paymentForm = await apiHelper.openPaymentFormSnapshot(request);
    const firstSubmit = await apiHelper.submitPaymentWithCsrfTokenRaw(
      request,
      paymentForm.csrfToken!,
    );
    const secondSubmit = await apiHelper.submitPaymentWithCsrfTokenRaw(
      request,
      paymentForm.csrfToken!,
    );

    const uniquePaymentArtifactIds = [
      ...new Set(
        [firstSubmit.paymentArtifactId, secondSubmit.paymentArtifactId].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    ];

    expect(firstSubmit.status).toBe(302);
    expect(firstSubmit.location).toMatch(/\/payment_done\/\d+/);

    // Expected defect-free contract:
    // the payment_done artifact value should not be derived from cart amount,
    // and replay after cart reset must not produce a success artifact such as payment_done/0.
    // test.fail(...) above keeps this scenario traceable in CI until bug #22 is fixed.
    expect(firstSubmit.paymentArtifactId).not.toBe(expectedAmount);
    expect(secondSubmit.status).not.toBe(302);
    expect(secondSubmit.location).not.toBe('/payment_done/0');
    expect(secondSubmit.paymentArtifactId).not.toBe('0');

    const paymentDoneStatuses: string[] = [];
    const invoiceStatuses: string[] = [];

    for (const paymentArtifactId of uniquePaymentArtifactIds) {
      const paymentDone = await apiHelper.captureTransportResponse(
        request,
        `/payment_done/${paymentArtifactId}`,
      );
      const invoice = await apiHelper.captureTransportResponse(
        request,
        `/download_invoice/${paymentArtifactId}`,
      );

      paymentDoneStatuses.push(`${paymentArtifactId}:${paymentDone.status}`);
      invoiceStatuses.push(`${paymentArtifactId}:${invoice.status}`);
    }

    const cartAfterReplay = await apiHelper.openCartViaTransport(request);
    const cartStillContainsProduct = cartAfterReplay.includes(`product-${productId}`);

    expect(cartStillContainsProduct).toBe(false);

    testInfo.annotations.push({
      type: 'Finding',
      description: [
        `first=${firstSubmit.status}:${firstSubmit.location || '<no-location>'}`,
        `second=${secondSubmit.status}:${secondSubmit.location || '<no-location>'}`,
        `paymentArtifactIds=${uniquePaymentArtifactIds.join(',') || '<none>'}`,
        `paymentDone=${paymentDoneStatuses.join(',') || '<none>'}`,
        `invoice=${invoiceStatuses.join(',') || '<none>'}`,
        `cartContainsProduct=${cartStillContainsProduct}`,
      ].join(' | '),
    });
  });
});
