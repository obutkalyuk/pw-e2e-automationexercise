import { expect } from '@playwright/test';
import { CartPage } from '../../pages/cart.page';
import { CheckoutPage } from '../../pages/checkout.page';
import { LoginPage } from '../../pages/login.page';
import { PaymentPage } from '../../pages/payment.page';
import { ProductsPage } from '../../pages/products.page';
import { TEST_CARD } from '../../data/payment.data';
import { apiHelper } from '../../utils/api-helper';
import { test } from '../../utils/fixtures';

test.describe('Deleted account checkout tests', () => {
  test('E2E-28: Deleted account cannot complete checkout from stale UI session @critical', async ({
    page,
    request,
    managedUser,
  }, testInfo) => {
    test.setTimeout(60_000);
    test.fail(
      true,
      'Known defect (#46): deleted account can continue checkout/payment from a stale UI session.',
    );

    const loginPage = new LoginPage(page);
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const paymentPage = new PaymentPage(page);
    const productId = '1';

    await test.step('Login and add product to cart via UI', async () => {
      await loginPage.goto();
      await loginPage.login(managedUser);
      await loginPage.verifyLoginSuccess(managedUser);
      await loginPage.goToProducts();
      await productsPage.addProductById(productId);
      await productsPage.goToCart();
      await cartPage.verifyProductInCart([productId]);
    });

    await test.step('Delete account through API while browser session remains active', async () => {
      await apiHelper.deleteUser(request, managedUser);
    });

    await test.step('Verify stale UI session cannot complete checkout', async () => {
      await cartPage.proceedToCheckout();

      if (/\/login/.test(page.url())) {
        await expect(loginPage.loginButton).toBeVisible();
        return;
      }

      await checkoutPage.verifyProductInCheckout([productId]);
      await checkoutPage.placeOrder();
      await paymentPage.fillPaymentDetails(TEST_CARD);
      await paymentPage.clickPayAndConfirm();

      const hasReachedPaymentDone = await page
        .waitForURL(/\/payment_done\/\d+/, { timeout: 10_000 })
        .then(() => true)
        .catch(() => false);

      expect(hasReachedPaymentDone).toBe(false);
      await expect(paymentPage.orderPlacedHeading).toBeHidden();
    });

    testInfo.annotations.push({
      type: 'Finding',
      description: `Account ${managedUser.email} was deleted before checkout continuation from an existing UI session.`,
    });
  });
});
