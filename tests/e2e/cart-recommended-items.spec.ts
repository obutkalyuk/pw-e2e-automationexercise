import { CartPage } from '../../pages/cart.page';
import { HomePage } from '../../pages/home.page';
import { test } from '../../utils/fixtures';

test('E2E-22: Add to cart from Recommended items @medium', async ({ page }) => {
  const homePage = new HomePage(page);
  const cartPage = new CartPage(page);
  let productId = '';

  await test.step('Navigate to home page', async () => {
    await page.goto('/');
    await homePage.verifyHomePageOpen();
  });

  await test.step('Add recommended product to cart', async () => {
    await homePage.verifyRecommendedItemsVisible();
    productId = await homePage.addRecommendedProductToCart(1);
  });

  await test.step('Open cart and verify recommended product', async () => {
    await homePage.viewCartFromRecommendedModal();
    await cartPage.verifyCartHasProducts();
    await cartPage.verifyProductInCart([productId]);
  });
});
