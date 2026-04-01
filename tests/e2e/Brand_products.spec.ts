import { test } from '@playwright/test';
import { ProductsPage } from '../../pages/productsPage';
import { apiHelper } from '../../utils/apiHelper';

const firstBrand = 'Polo';
const secondBrand = 'Biba';

test('E2E-19: View & Cart Brand Products @medium', async ({ page, request }) => {
  const productsPage = new ProductsPage(page);
  const products = await apiHelper.getProductsList(request);

  await page.goto('/');
  await productsPage.goToProducts();

  await test.step('Verify brands are visible on left sidebar', async () => {
    await productsPage.verifyProductsPageOpen();
    await productsPage.productSidebar.verifyBrandsVisible();
  });

  await test.step(`Open ${firstBrand} brand page`, async () => {
    await productsPage.productSidebar.openBrand(firstBrand, () => productsPage.handleCommonAds());
    await productsPage.productSidebar.verifyBrandResult(firstBrand);
    await productsPage.verifyProductsListVisible();
    await productsPage.productCatalog.verifyVisibleProductsMatchBrand(products, firstBrand);
  });

  await test.step(`Open ${secondBrand} brand page`, async () => {
    await productsPage.productSidebar.openBrand(secondBrand, () => productsPage.handleCommonAds());
    await productsPage.productSidebar.verifyBrandResult(secondBrand);
    await productsPage.verifyProductsListVisible();
    await productsPage.productCatalog.verifyVisibleProductsMatchBrand(products, secondBrand);
  });
});
