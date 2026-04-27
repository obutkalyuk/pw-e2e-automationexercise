import { expect } from '@playwright/test';
import { test } from '../../utils/fixtures';
import { ProductsPage } from '../../pages/products.page';
import { CartPage } from '../../pages/cart.page';

test('E2E-12: Add Products in Cart @high', async ({ page, request }) => {
  test.setTimeout(45000);
  const productsPage = new ProductsPage(page);
  const cartPage = new CartPage(page);
  const productIds = ['1', '2'];

  await page.goto('/products');

  await test.step('Navigate to products page', async () => {
    await productsPage.verifyProductsPageOpen();
    await productsPage.verifyProductsListVisible();
  });

  await test.step('Add first product and continue shopping', async () => {
    await productsPage.addProductById(productIds[0]);
  });

  await test.step('Add second product and open cart', async () => {
    await productsPage.addProductToCart(productIds[1]);
    await productsPage.viewCartFromModal();
    await cartPage.verifyCartIsOpen();
  });

  await test.step('Verify cart rows, prices, quantities and totals', async () => {
    const response = await request.get('/api/productsList');
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.responseCode).toBe(200);

    const expectedProducts = productIds.map((id) => {
      const product = body.products.find((item: { id: number }) => item.id === Number(id));
      expect(product, `Product with id ${id} was not found in API response`).toBeTruthy();

      return {
        id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total: product.price,
      };
    });

    await cartPage.verifyProductInCart(productIds);
    await cartPage.verifyCartProductsData(expectedProducts);
  });
});
