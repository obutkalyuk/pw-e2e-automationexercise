import { test } from '@playwright/test';
import { ProductsPage } from '../../pages/productsPage';

test('E2E-9: Search Product @high', async ({ page }, testInfo) => {
  const productsPage = new ProductsPage(page);
  const searchTerm = 'Blue Top';

  testInfo.annotations.push({
    type: 'Test Data',
    description: `Search term: ${searchTerm}`,
  });

  await page.goto('/products');
  await productsPage.handleCommonAds();

  await test.step('Open products page', async () => {
    await productsPage.verifyProductsPageOpen();
  });

  await test.step(`Search for product by term "${searchTerm}"`, async () => {
    await productsPage.searchProduct(searchTerm);
    await productsPage.verifySearchResults(searchTerm);
  });
});
