import { expect } from '@playwright/test';
import { User } from '../../data/user.data';
import { LoginPage } from '../../pages/login.page';
import { SignupPage } from '../../pages/signup.page';
import { CartPage } from '../../pages/cart.page';
import { CheckoutPage } from '../../pages/checkout.page';
import { test } from '../../utils/fixtures';
import { apiHelper } from '../../utils/api-helper';

test('E2E-29: Account signup should reject or normalize raw punctuation in profile fields @medium', async ({
  page,
  request,
  createdUserCleanup,
}, testInfo) => {
  test.fail(
    true,
    'Known defect (#52): UI signup accepts raw punctuation in account profile fields and checkout reflects it without normalization.',
  );

  const loginPage = new LoginPage(page);
  const signupPage = new SignupPage(page);
  const cartPage = new CartPage(page);
  const checkoutPage = new CheckoutPage(page);
  const user = User.generateRandom();
  const rawPunctuation = `!"#;%:?''`;
  const productId = '1';

  user.name = `Raw ${rawPunctuation} User`;
  user.firstName = `John ${rawPunctuation}`;
  user.lastName = `Doe ${rawPunctuation}`;
  user.company = `QA ${rawPunctuation} Inc`;
  user.address = `Main ${rawPunctuation} Street`;
  user.state = `State ${rawPunctuation}`;
  user.city = `City ${rawPunctuation}`;
  user.zipcode = `Zip ${rawPunctuation}`;
  user.mobileNumber = `555${rawPunctuation}`;

  createdUserCleanup.track(user);
  testInfo.annotations.push({
    type: 'Test Data',
    description: `Email: ${user.email} | Raw punctuation: ${rawPunctuation}`,
  });

  const accountCreated =
    await test.step('Sign up through UI with raw punctuation in profile fields', async () => {
      await loginPage.goto();
      await loginPage.signUp(user);
      await signupPage.fillForm(user);

      return await page
        .waitForURL(/\/account_created/, { timeout: 5000, waitUntil: 'domcontentloaded' })
        .then(() => true)
        .catch(() => false);
    });

  if (!accountCreated) {
    return;
  }

  await test.step('Continue after account creation', async () => {
    await expect(page.locator('h2:has-text("Account Created!")')).toBeVisible();
    await signupPage.continueButton.click();
  });

  await test.step('Open checkout address view for the created account', async () => {
    const cookieHeader = await loginPage.getCookieHeader();
    await apiHelper.addProductToCart(request, productId, cookieHeader);

    await page.goto('/view_cart');
    await cartPage.verifyCartHasProducts();
    await cartPage.proceedToCheckout();
  });

  const deliveryAddressText = await checkoutPage.deliveryAddress.innerText();
  const billingAddressText = await checkoutPage.billingAddress.innerText();

  testInfo.annotations.push({
    type: 'Finding',
    description: `deliveryAddress=${deliveryAddressText.replace(/\s+/g, ' ').trim()}`,
  });
  testInfo.annotations.push({
    type: 'Finding',
    description: `billingAddress=${billingAddressText.replace(/\s+/g, ' ').trim()}`,
  });

  expect(deliveryAddressText).not.toContain(rawPunctuation);
  expect(billingAddressText).not.toContain(rawPunctuation);
});
