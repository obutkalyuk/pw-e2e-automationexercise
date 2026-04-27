import { expect } from '@playwright/test';
import { apiHelper } from '../../utils/api-helper';
import { User } from '../../data/user.data';
import { LoginPage } from '../../pages/login.page';
import { SignupPage } from '../../pages/signup.page';
import { ProductsPage } from '../../pages/products.page';
import { CartPage } from '../../pages/cart.page';
import { CheckoutPage } from '../../pages/checkout.page';
import { PaymentPage } from '../../pages/payment.page';
import { TEST_CARD } from '../../data/payment.data';
import { test } from '../../utils/fixtures';
import { extractInvoiceAmount } from '../../utils/transport-html';

test('E2E-14: Register while Checkout preserves cart @high', async ({
  page,
  createdUserCleanup,
}, testInfo) => {
  test.setTimeout(75_000);
  const signUpPage = new SignupPage(page);
  const loginPage = new LoginPage(page);
  const productPage = new ProductsPage(page);
  const cartPage = new CartPage(page);

  const products = ['1', '2', '3'];
  const user = User.generateRandom();
  createdUserCleanup.track(user);
  testInfo.annotations.push({
    type: 'Test Data',
    description: `Name: ${user.name} | Email: ${user.email} | Password: ${user.password}`,
  });

  await test.step(`Add products to cart and proceed to checkout`, async () => {
    await page.goto('/products');
    await productPage.addMultipleProducts(products);
    await productPage.goToCart();
    await cartPage.proceedToCheckout();
    await cartPage.loginFromModal();
  });
  await test.step(`Sign up new user`, async () => {
    await loginPage.signUp(user);
    await signUpPage.fillForm(user);
    await signUpPage.verifyAccountCreation();
  });
  await test.step(`Verify products are still in cart after registration`, async () => {
    await cartPage.goToCart();
    await cartPage.verifyProductInCart(products);
  });
});

test.describe('Place Order tests', () => {
  test('E2E-15: Login while Checkout preserves cart @high', async ({ page, managedUser }) => {
    const productPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const loginPage = new LoginPage(page);

    const products = ['1', '3', '5'];

    await test.step(`Add products to cart and proceed to checkout`, async () => {
      await page.goto('/products');
      await productPage.addMultipleProducts(products);
      await productPage.goToCart();
      await cartPage.proceedToCheckout();
      await cartPage.loginFromModal();
    });
    await test.step(`Login with existing user`, async () => {
      await loginPage.login(managedUser);
      await loginPage.verifyLoginSuccess(managedUser);
    });
    await test.step(`Verify products are still in cart after login`, async () => {
      await loginPage.goToCart();
      await cartPage.verifyProductInCart(products);
    });
  });

  test('E2E-16: Place Order: Login before Checkout @critical', async ({ page, managedUser }) => {
    test.setTimeout(45_000);
    const loginPage = new LoginPage(page);
    const productPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const paymentPage = new PaymentPage(page);

    const products = ['2', '4', '6'];

    await test.step(`Login with existing user`, async () => {
      await loginPage.goto();
      await loginPage.login(managedUser);
      await loginPage.verifyLoginSuccess(managedUser);
    });
    await test.step(`Add products to cart, proceed to checkout and place order`, async () => {
      await loginPage.goToProducts();
      await productPage.addMultipleProducts(products);
      await productPage.goToCart();
      await cartPage.verifyProductInCart(products);
      await cartPage.proceedToCheckout();
      await checkoutPage.verifyProductInCheckout(products);
    });
    await test.step(`Fill payment details and confirm order`, async () => {
      await checkoutPage.placeOrder();
      await paymentPage.fillPaymentDetails(TEST_CARD);
      await paymentPage.clickPayAndConfirm();
      await paymentPage.verifyPaymentSuccess();
    });
  });

  test('E2E-23: Verify address details in Checkout page @high', async ({
    page,
    request,
    managedUser,
  }) => {
    test.setTimeout(45_000);
    const loginPage = new LoginPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const productId = '1';

    await test.step(`Login with existing user`, async () => {
      await loginPage.goto();
      await loginPage.login(managedUser);
      await loginPage.verifyLoginSuccess(managedUser);
    });

    await test.step(`Add product to cart via API and proceed to checkout`, async () => {
      const cookieHeader = await loginPage.getCookieHeader();
      await apiHelper.addProductToCart(request, productId, cookieHeader);

      await page.goto('/view_cart');
      await cartPage.verifyCartIsOpen();
      await cartPage.proceedToCheckout();
      await checkoutPage.verifyProductInCheckout([productId]);
    });

    await test.step(`Verify delivery and billing addresses`, async () => {
      await checkoutPage.verifyAddressDetails(managedUser);
    });
  });

  test('E2E-24: Download invoice after purchase order @high', async ({
    page,
    request,
    managedUser,
    browserName,
  }) => {
    test.setTimeout(60_000);
    const loginPage = new LoginPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const paymentPage = new PaymentPage(page);
    const signUpPage = new SignupPage(page);
    const productId = '1';
    const expectedAmount = await apiHelper.getExpectedInvoiceAmountForProduct(request, productId);

    await test.step('Login with existing user', async () => {
      await loginPage.goto();
      await loginPage.login(managedUser);
      await loginPage.verifyLoginSuccess(managedUser);
    });

    await test.step('Prepare cart via API using browser session cookies', async () => {
      const cookieHeader = await loginPage.getCookieHeader();
      await apiHelper.addProductToCart(request, productId, cookieHeader);

      await page.goto('/view_cart');
      await cartPage.verifyCartIsOpen();
      await cartPage.verifyProductInCart([productId]);
    });

    await test.step('Complete checkout via UI', async () => {
      await cartPage.proceedToCheckout();
      await checkoutPage.verifyProductInCheckout([productId]);
      await checkoutPage.placeOrder();
      await paymentPage.fillPaymentDetails(TEST_CARD);
      await paymentPage.clickPayAndConfirm();
      await paymentPage.verifyOrderPlaced();
    });

    await test.step('Download invoice and verify its contents', async () => {
      const orderPlacedUrl = page.url();
      const invoiceArtifact = await paymentPage.getInvoiceArtifact();

      if (invoiceArtifact.kind === 'download') {
        expect(invoiceArtifact.suggestedFileName.toLowerCase()).toContain('invoice');
      }

      expect(invoiceArtifact.content).toContain('Your total purchase amount is');
      expect(extractInvoiceAmount(invoiceArtifact.content)).toBe(expectedAmount);

      if (invoiceArtifact.kind === 'inline' && browserName === 'webkit') {
        await page.goto(orderPlacedUrl);
        await paymentPage.verifyOrderPlaced();
      }
    });

    await test.step('Continue and delete account via UI', async () => {
      await paymentPage.continueAfterOrderPlaced();
      await paymentPage.deleteAccount();
      await signUpPage.verifyAccountDeleted();
    });
  });
});

test('BUG-4: Payment field is blocked by overlay on large screens', async ({ page }) => {
  const paymentPage = new PaymentPage(page);

  await page.setViewportSize({ width: 980, height: 900 });
  await page.goto('/payment');
  const clickError = await paymentPage.nameOnCardInput
    .click({ timeout: 3000 })
    .catch((error) => error);

  expect(clickError).toBeInstanceOf(Error);
  expect((clickError as Error).message).toMatch(/intercepts pointer events|timeout/i);
});
