import { expect } from '@playwright/test';
import { test } from '../../../utils/fixtures';
import { apiHelper } from '../../../utils/api-helper';
import { extractInvoiceAmount } from '../../../utils/transport-html';

test.describe('Order State Coverage', () => {
  test('[API-24][TR-15] Completed purchase should keep cart empty across logout and new login @high', async ({
    request,
    managedUser,
  }) => {
    const productId = '1';
    const expectedAmount = await apiHelper.getExpectedInvoiceAmountForProduct(request, productId);

    await apiHelper.loginViaTransport(request, managedUser);
    await apiHelper.addProductToCartViaTransport(request, productId);
    await apiHelper.expectCheckoutContainsAmount(request, expectedAmount);

    const paymentResult = await apiHelper.submitPaymentViaTransport(request);

    await apiHelper.openPaymentDoneViaTransport(request, paymentResult.paymentArtifactId);
    await apiHelper.expectCartDoesNotContainProduct(request, productId);
    await apiHelper.logoutViaTransport(request);
    await apiHelper.loginViaTransport(request, managedUser);
    await apiHelper.expectCartDoesNotContainProduct(request, productId);
  });

  test('[API-25][TR-16] Checkout amount should match invoice amount after successful purchase @high', async ({
    request,
    managedUser,
  }, testInfo) => {
    const productId = '1';
    const expectedAmount = await apiHelper.getExpectedInvoiceAmountForProduct(request, productId);

    await apiHelper.loginViaTransport(request, managedUser);
    await apiHelper.addProductToCartViaTransport(request, productId);
    await apiHelper.expectCheckoutContainsAmount(request, expectedAmount);

    const paymentResult = await apiHelper.submitPaymentViaTransport(request);
    const invoiceBody = await apiHelper.downloadInvoiceViaTransport(
      request,
      paymentResult.paymentArtifactId,
    );
    const invoiceAmount = extractInvoiceAmount(invoiceBody);

    expect(invoiceAmount).toBe(expectedAmount);

    testInfo.annotations.push({
      type: 'Finding',
      description: `checkoutAmount=${expectedAmount} | invoiceAmount=${invoiceAmount} | paymentArtifactId=${paymentResult.paymentArtifactId}`,
    });
  });
});
