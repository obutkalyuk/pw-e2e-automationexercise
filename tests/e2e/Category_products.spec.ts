import { test } from '@playwright/test';
import { HomePage } from '../../pages/homePage';

test('E2E-18: View Category Products @medium', async ({ page }) => {
  const homePage = new HomePage(page);

  await page.goto('/');
  await homePage.handleCommonAds();

  await test.step('Verify categories are visible on left sidebar', async () => {
    await homePage.productSidebar.verifyCategoriesVisible();
  });

  await test.step('Open Women > Tops category page', async () => {
    await homePage.productSidebar.expandCategory('Women', () => homePage.handleCommonAds());
    await homePage.productSidebar.openSubcategory('Women', 'Tops', () => homePage.handleCommonAds());
    await homePage.productSidebar.verifyCategoryResult('Women', 'Tops', '2');
    await homePage.productCatalog.verifyProductsListVisible();
  });

  await test.step('Open Men > Jeans category page', async () => {
    await homePage.productSidebar.expandCategory('Men', () => homePage.handleCommonAds());
    await homePage.productSidebar.openSubcategory('Men', 'Jeans', () => homePage.handleCommonAds());
    await homePage.productSidebar.verifyCategoryResult('Men', 'Jeans', '6');
    await homePage.productCatalog.verifyProductsListVisible();
  });
});
