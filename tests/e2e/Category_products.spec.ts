import { expect, test } from '@playwright/test';
import { HomePage } from '../../pages/homePage';
import { ProductApiModel } from '../../data/product';

async function verifyVisibleProductsMatchCategory(
  homePage: HomePage,
  products: ProductApiModel[],
  categoryName: string,
  subcategoryName: string
) {
  const visibleProductIds = await homePage.productCatalog.getVisibleProductIds();
  expect(visibleProductIds.length).toBeGreaterThan(0);

  for (const productId of visibleProductIds) {
    const product = products.find(item => item.id === Number(productId));
    expect(product, `Product with id ${productId} was not found in API response`).toBeTruthy();
    expect(product!.category.usertype.usertype).toBe(categoryName);
    expect(product!.category.category).toBe(subcategoryName);
  }
}

test('E2E-18: View Category Products @medium', async ({ page, request }) => {
  const homePage = new HomePage(page);
  const response = await request.get('/api/productsList');
  const body = await response.json();

  expect(response.status()).toBe(200);
  expect(body.responseCode).toBe(200);

  await page.goto('/');
  await homePage.handleCommonAds();

  await test.step('Verify categories are visible on left sidebar', async () => {
    await homePage.productSidebar.verifyCategoriesVisible();
  });

  await test.step('Open Women > Tops category page', async () => {
    await homePage.productSidebar.expandCategory('Women', () => homePage.handleCommonAds());
    await homePage.productSidebar.openSubcategory('Women', 'Saree', () => homePage.handleCommonAds());
    await homePage.productSidebar.verifyCategoryResult('Women', 'Saree', '7');
    await homePage.productCatalog.verifyProductsListVisible();
    await verifyVisibleProductsMatchCategory(homePage, body.products, 'Women', 'Saree');
  });

  await test.step('Open Men > Jeans category page', async () => {
    await homePage.productSidebar.expandCategory('Men', () => homePage.handleCommonAds());
    await homePage.productSidebar.openSubcategory('Men', 'Jeans', () => homePage.handleCommonAds());
    await homePage.productSidebar.verifyCategoryResult('Men', 'Jeans', '6');
    await homePage.productCatalog.verifyProductsListVisible();
    await verifyVisibleProductsMatchCategory(homePage, body.products, 'Men', 'Jeans');
  });
});
