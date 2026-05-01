import { createSubscriptionEmail } from '../../data/subscription.data';
import { CartPage } from '../../pages/cart.page';
import { HomePage } from '../../pages/home.page';
import { test } from '../../utils/fixtures';

test('E2E-10: Verify Subscription in Home Page @medium', async ({ page }, testInfo) => {
  const homePage = new HomePage(page);
  const subscriptionEmail = createSubscriptionEmail(testInfo);

  await test.step('Navigate to home page and verify', async () => {
    await page.goto('/');
    await homePage.verifyHomePageOpen();
  });

  await test.step('Submit footer subscription', async () => {
    await homePage.subscription.verifySubscriptionVisible();
    await homePage.subscription.submitSubscription(subscriptionEmail);
    await homePage.subscription.verifySubscriptionSubmitted();
  });
});

test('E2E-11: Verify Subscription in Cart Page @medium', async ({ page }, testInfo) => {
  const homePage = new HomePage(page);
  const cartPage = new CartPage(page);
  const subscriptionEmail = createSubscriptionEmail(testInfo);

  await test.step('Navigate to home page and verify', async () => {
    await page.goto('/');
    await homePage.verifyHomePageOpen();
  });

  await test.step('Open cart page', async () => {
    await homePage.goToCart();
    await cartPage.verifyCartPageOpen();
  });

  await test.step('Submit footer subscription', async () => {
    await cartPage.subscription.verifySubscriptionVisible();
    await cartPage.subscription.submitSubscription(subscriptionEmail);
    await cartPage.subscription.verifySubscriptionSubmitted();
  });
});

test('E2E-10-neg [BUG-43]: Home page subscription should send email data to the server @low', async ({
  page,
}, testInfo) => {
  test.fail(
    true,
    'Known defect (BF-002): Footer subscription shows a success message without sending a network request.',
  );

  const homePage = new HomePage(page);
  const subscriptionEmail = createSubscriptionEmail(testInfo);

  await page.goto('/');
  await homePage.verifyHomePageOpen();
  await homePage.subscription.verifySubscriptionVisible();

  const subscriptionRequest = page.waitForRequest(
    (request) => {
      const requestUrl = new URL(request.url());
      const pageUrl = new URL(page.url());

      return request.method() === 'POST' && requestUrl.origin === pageUrl.origin;
    },
    { timeout: 3_000 },
  );

  await homePage.subscription.submitSubscription(subscriptionEmail);
  await subscriptionRequest;
});

test('E2E-11-neg [BUG-43]: Cart page subscription should send email data to the server @low', async ({
  page,
}, testInfo) => {
  test.fail(
    true,
    'Known defect (BF-002): Footer subscription shows a success message without sending a network request.',
  );

  const homePage = new HomePage(page);
  const cartPage = new CartPage(page);
  const subscriptionEmail = createSubscriptionEmail(testInfo);

  await page.goto('/');
  await homePage.verifyHomePageOpen();
  await homePage.goToCart();
  await cartPage.verifyCartPageOpen();
  await cartPage.subscription.verifySubscriptionVisible();

  const subscriptionRequest = page.waitForRequest(
    (request) => {
      const requestUrl = new URL(request.url());
      const pageUrl = new URL(page.url());

      return request.method() === 'POST' && requestUrl.origin === pageUrl.origin;
    },
    { timeout: 3_000 },
  );

  await cartPage.subscription.submitSubscription(subscriptionEmail);
  await subscriptionRequest;
});
