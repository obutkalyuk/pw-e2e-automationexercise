import { expect } from '@playwright/test';
import type { Result } from 'axe-core';
import { CartPage } from '../../pages/cart.page';
import { CheckoutPage } from '../../pages/checkout.page';
import { LoginPage } from '../../pages/login.page';
import { test } from '../../utils/fixtures';
import { analyzePage, formatViolations } from './a11y-analysis.helper';

const productId = '1';

test('[A11Y-7] Cart page has no critical or serious static a11y violations for logged-in user @a11y-smoke', async ({
  page,
  managedUser,
}, testInfo) => {
  testInfo.annotations.push({ type: 'Page', description: '/view_cart' });
  test.fail(
    true,
    'Known a11y defects: #54 footer subscribe button has no accessible name, #55 site-wide color contrast failures.',
  );
  const loginPage = new LoginPage(page);
  const cartPage = new CartPage(page);
  let violations: Result[] = [];

  await test.step('navigate', async () => {
    await loginPage.goto();
  });

  await test.step('setup', async () => {
    await loginPage.login(managedUser);
    await loginPage.verifyLoginSuccess(managedUser);
    await page.goto(`/add_to_cart/${productId}`);
    await page.goto('/view_cart');
    await cartPage.verifyProductInCart([productId]);
  });

  await test.step('analyze', async () => {
    violations = await analyzePage(page);
  });

  await test.step('assert', async () => {
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });
});

test('[A11Y-8] Checkout page has no critical or serious static a11y violations for logged-in user @a11y-smoke', async ({
  page,
  managedUser,
}, testInfo) => {
  testInfo.annotations.push({ type: 'Page', description: '/checkout' });
  test.fail(
    true,
    'Known a11y defects: #54 footer subscribe button has no accessible name, #55 site-wide color contrast failures, #56 checkout comment field is missing an associated label.',
  );
  const loginPage = new LoginPage(page);
  const cartPage = new CartPage(page);
  const checkoutPage = new CheckoutPage(page);
  let violations: Result[] = [];

  await test.step('navigate', async () => {
    await loginPage.goto();
  });

  await test.step('setup', async () => {
    await loginPage.login(managedUser);
    await loginPage.verifyLoginSuccess(managedUser);
    await page.goto(`/add_to_cart/${productId}`);
    await page.goto('/view_cart');
    await cartPage.verifyProductInCart([productId]);
    await cartPage.proceedToCheckout();
    await checkoutPage.verifyProductInCheckout([productId]);
  });

  await test.step('analyze', async () => {
    violations = await analyzePage(page);
  });

  await test.step('assert', async () => {
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });
});
