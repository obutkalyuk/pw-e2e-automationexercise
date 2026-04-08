import { test } from '../../../utils/fixtures';
import { apiHelper } from '../../../utils/apiHelper';

test.describe('Transport Request Coverage', () => {
  test('[TR-1] POST /login - authenticate user via transport flow @high', async ({ request, managedUser }) => {
    await apiHelper.loginViaTransport(request, managedUser);
  });

  test('[TR-2][TR-3][TR-4] cart -> checkout -> payment documents for active session @high', async ({ request, managedUser }) => {
    await apiHelper.loginViaTransport(request, managedUser);
    await apiHelper.addProductToCartViaTransport(request, '1');
    await apiHelper.openCheckoutViaTransport(request);
    await apiHelper.openPaymentViaTransport(request);
  });

  test('[TR-5] POST /payment - submit payment and verify redirect to order completion @critical', async ({ request, managedUser }) => {
    await apiHelper.loginViaTransport(request, managedUser);
    await apiHelper.addProductToCartViaTransport(request, '1');
    await apiHelper.openCheckoutViaTransport(request);

    const paymentResult = await apiHelper.submitPaymentViaTransport(request);

    await apiHelper.openPaymentDoneViaTransport(request, paymentResult.orderId);
  });

  test('[TR-6] GET /download_invoice/{orderId} - download invoice after successful purchase @medium', async ({ request, managedUser }) => {
    const productId = '1';
    const expectedAmount = await apiHelper.getExpectedInvoiceAmountForProduct(request, productId);

    await apiHelper.loginViaTransport(request, managedUser);
    await apiHelper.addProductToCartViaTransport(request, productId);
    await apiHelper.openCheckoutViaTransport(request);

    const paymentResult = await apiHelper.submitPaymentViaTransport(request);

    await apiHelper.downloadInvoiceViaTransport(request, paymentResult.orderId, expectedAmount);
  });
});
