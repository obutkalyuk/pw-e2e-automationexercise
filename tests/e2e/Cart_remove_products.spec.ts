import { test } from '@playwright/test';
import { HomePage } from '../../pages/homePage';
import { CartPage } from '../../pages/cartPage';

test('E2E-17: Remove Products From Cart @high', async ({ page }) => {
  const homePage = new HomePage(page);
  const cartPage = new CartPage(page);
  const productNumber = 1;
  const productId = '1';

  await page.goto('/');
  await homePage.handleCommonAds();

  await test.step('Add product to cart and open cart', async () => {
    await homePage.addProductToCart(productNumber);
    await homePage.viewCartFromModal();
    await cartPage.verifyCartIsOpen();
    await cartPage.verifyProductInCart([productId]);
  });

  await test.step('Remove product from cart', async () => {
    await cartPage.deleteProduct(productId);
  });
});
