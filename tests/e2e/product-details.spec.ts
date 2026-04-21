import { expect } from '@playwright/test';
import { test } from '../../utils/fixtures';
import { HomePage } from '../../pages/home.page';
import { ProductsPage } from '../../pages/products.page';
import { ProductDetailsPage } from '../../pages/product-details.page';

test('E2E-8: Verify All Products and product detail page @high', async ({ page, request }) => {
  const homePage = new HomePage(page);
  const productsPage = new ProductsPage(page);
  const productDetailsPage = new ProductDetailsPage(page);
  const productNumber = 1;
  let productId = '';

  await page.goto('/');
  await productsPage.handleCommonAds();

  await test.step('Verify home page is visible', async () => {
    await homePage.verifyHomePageOpen();
  });

  await test.step('Navigate to products page', async () => {
    await productsPage.goToProducts();
    await productsPage.verifyProductsPageOpen();
    await productsPage.verifyProductsListVisible();
  });

  await test.step('Open first product details page', async () => {
    productId = await productsPage.getProductDetailsId(productNumber);
    await productsPage.openProductDetails(productNumber);
    await productDetailsPage.verifyProductDetailsPageOpen();
  });

  await test.step('Verify product details content matches API data', async () => {
    const response = await request.get('/api/productsList');
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.responseCode).toBe(200);

    const product = body.products.find((item: { id: number }) => item.id === Number(productId));
    expect(product, `Product with id ${productId} was not found in API response`).toBeTruthy();

    await productDetailsPage.verifyProductDetailsContent(product);
  });
});
