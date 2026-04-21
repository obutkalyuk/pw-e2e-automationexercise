import { test } from '../../../utils/fixtures';
import { apiHelper } from '../../../utils/apiHelper';

test.describe('Full Purchase Flow Coverage', () => {
  // API-18 | Purchase request chain (login -> cart -> checkout -> payment)
  // Verify end-to-end transactional request chain without UI noise.
  // Planned smoke coverage for session, cart, checkout, CSRF, payment redirect chain.
  test('[API-18] Purchase request chain (login -> cart -> checkout -> payment) @critical @smoke', async ({
    request,
    managedUser,
  }) => {
    const productId = '1';
    const expectedAmount = await apiHelper.getExpectedInvoiceAmountForProduct(request, productId);

    await apiHelper.loginViaTransport(request, managedUser);
    await apiHelper.addProductToCartViaTransport(request, productId);
    await apiHelper.expectCheckoutContainsAmount(request, expectedAmount);
    await apiHelper.openPaymentViaTransport(request);

    const paymentResult = await apiHelper.submitPaymentViaTransport(request);

    await apiHelper.openPaymentDoneViaTransport(request, paymentResult.paymentArtifactId);
  });
});
