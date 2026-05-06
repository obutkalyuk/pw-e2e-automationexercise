import { expect, Locator, Page } from '@playwright/test';
import { TEST_CARD } from '../../data/payment.data';
import { CartPage } from '../../pages/cart.page';
import { CheckoutPage } from '../../pages/checkout.page';
import { LoginPage } from '../../pages/login.page';
import { PaymentPage } from '../../pages/payment.page';
import { ProductDetailsPage } from '../../pages/product-details.page';
import { ProductsPage } from '../../pages/products.page';
import { apiHelper } from '../../utils/api-helper';
import { test } from '../../utils/fixtures';

const productId = '1';

async function expectFocusMoved(page: Page, previousSelector: string) {
  const probeAttribute = 'data-pw-focus-probe';

  await page.evaluate(
    ({ attribute, selector }) => {
      const activeElement = document.activeElement;

      if (activeElement instanceof HTMLElement) {
        activeElement.setAttribute(attribute, selector);
      }
    },
    { attribute: probeAttribute, selector: previousSelector },
  );

  await page.keyboard.press('Tab');

  const focusMoved = await page.evaluate((attribute) => {
    return document.activeElement?.getAttribute(attribute) === null;
  }, probeAttribute);

  await page.evaluate((attribute) => {
    document.querySelector(`[${attribute}]`)?.removeAttribute(attribute);
  }, probeAttribute);

  expect(focusMoved, `Expected focus to move from ${previousSelector} after Tab`).toBeTruthy();
}

async function tabToLocator(page: Page, locator: Locator, maxTabs = 80) {
  const target = locator.first();

  await expect(target).toBeVisible();

  for (let tabIndex = 0; tabIndex < maxTabs; tabIndex += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) {
      return;
    }

    await page.keyboard.press('Tab');
  }

  throw new Error(`Could not move focus to locator after ${maxTabs} Tab presses`);
}

test('[A11Y-9] Keyboard - add product to cart @a11y-keyboard', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'Page', description: '/products' });
  const productsPage = new ProductsPage(page);
  const productDetailsPage = new ProductDetailsPage(page);
  const cartPage = new CartPage(page);
  let selectedProductId = productId;
  const firstViewProductLink = productsPage.productCatalog.viewProductLinks.first();

  await test.step('navigate', async () => {
    await page.goto('/products');
    await productsPage.verifyProductsPageOpen();
  });

  await test.step('act', async () => {
    await tabToLocator(page, firstViewProductLink);
    await Promise.all([
      page.waitForURL(/\/product_details\//, { waitUntil: 'domcontentloaded' }),
      page.keyboard.press('Enter'),
    ]);
    await productDetailsPage.verifyProductDetailsPageOpen();
    selectedProductId = await productDetailsPage.getCurrentProductId();

    await tabToLocator(page, productDetailsPage.addToCartButton);
    await page.keyboard.press('Enter');
    await expect(page.locator('#cartModal')).toBeVisible();
    await expect(page.locator('#cartModal')).toContainText('Added!');
    await expectFocusMoved(page, '.product-information button.btn.cart');

    await tabToLocator(page, page.getByRole('button', { name: 'Continue Shopping' }));
    await page.keyboard.press('Enter');
    await expect(page.locator('#cartModal')).toBeHidden();
  });

  await test.step('assert', async () => {
    await page.goto('/view_cart');
    await cartPage.verifyCartPageOpen();
    await cartPage.verifyProductInCart([selectedProductId]);
  });
});

test('[A11Y-10] Keyboard - complete purchase @a11y-keyboard', async ({
  page,
  request,
  managedUser,
}, testInfo) => {
  testInfo.annotations.push({ type: 'Page', description: '/view_cart -> /checkout -> /payment' });
  test.fail(
    true,
    'Known defect #60: Proceed To Checkout on cart page is not keyboard focusable, so keyboard-only users cannot continue to checkout.',
  );
  const loginPage = new LoginPage(page);
  const cartPage = new CartPage(page);
  const checkoutPage = new CheckoutPage(page);
  const paymentPage = new PaymentPage(page);

  await test.step('setup', async () => {
    await apiHelper.loginViaTransport(request, managedUser);
    await apiHelper.addProductToCartViaTransport(request, productId);
  });

  await test.step('navigate', async () => {
    await loginPage.goto();
    await expect(loginPage.loginEmailInput).toBeVisible();
  });

  await test.step('act', async () => {
    await tabToLocator(page, loginPage.loginEmailInput);
    await page.keyboard.type(managedUser.email);
    await page.keyboard.press('Tab');
    await expect(loginPage.loginPasswordInput).toBeFocused();
    await page.keyboard.type(managedUser.password);
    await tabToLocator(page, loginPage.loginButton);
    await Promise.all([
      page.waitForURL('/', { waitUntil: 'domcontentloaded' }),
      page.keyboard.press('Enter'),
    ]);
    await loginPage.verifyLoginSuccess(managedUser);

    await page.goto('/view_cart');
    await cartPage.verifyCartPageOpen();
    await cartPage.verifyProductInCart([productId]);

    await tabToLocator(page, cartPage.proceedToCheckoutButton);
    await Promise.all([
      page.waitForURL(/\/checkout/, { waitUntil: 'domcontentloaded' }),
      page.keyboard.press('Enter'),
    ]);
    await expectFocusMoved(page, 'body');
    await checkoutPage.verifyProductInCheckout([productId]);

    await tabToLocator(page, checkoutPage.placeOrderButton);
    await Promise.all([
      page.waitForURL(/\/payment/, { waitUntil: 'domcontentloaded' }),
      page.keyboard.press('Enter'),
    ]);
    await expectFocusMoved(page, 'body');

    await tabToLocator(page, paymentPage.nameOnCardInput);
    await page.keyboard.type(TEST_CARD.holder);
    await page.keyboard.press('Tab');
    await expect(paymentPage.cardNumberInput).toBeFocused();
    await page.keyboard.type(TEST_CARD.number);
    await page.keyboard.press('Tab');
    await expect(paymentPage.cvcInput).toBeFocused();
    await page.keyboard.type(TEST_CARD.cvc);
    await page.keyboard.press('Tab');
    await expect(paymentPage.expiryMonthInput).toBeFocused();
    await page.keyboard.type(TEST_CARD.expiryMonth);
    await page.keyboard.press('Tab');
    await expect(paymentPage.expiryYearInput).toBeFocused();
    await page.keyboard.type(TEST_CARD.expiryYear);
    await tabToLocator(page, paymentPage.payButton);
    await Promise.all([
      page.waitForURL(/\/payment_done/, { waitUntil: 'domcontentloaded' }),
      page.keyboard.press('Enter'),
    ]);
    await expectFocusMoved(page, 'body');
  });

  await test.step('assert', async () => {
    await expect(page.getByText('Your order has been placed successfully!')).toBeVisible();
  });
});
