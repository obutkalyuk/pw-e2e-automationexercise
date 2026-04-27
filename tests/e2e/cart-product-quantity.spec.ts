import { expect } from '@playwright/test';
import { test } from '../../utils/fixtures';
import { ProductDetailsPage } from '../../pages/product-details.page';
import { CartPage } from '../../pages/cart.page';

test('E2E-13: Verify Product quantity in Cart @high', async ({ page, request }) => {
  const productDetailsPage = new ProductDetailsPage(page);
  const cartPage = new CartPage(page);
  const productId = '1';
  const quantity = 4;

  await page.goto(`/product_details/${productId}`);

  await test.step('Open product details page', async () => {
    await productDetailsPage.verifyProductDetailsPageOpen();
  });

  await test.step(`Set quantity to ${quantity} and add product to cart`, async () => {
    await productDetailsPage.setQuantity(quantity);
    await productDetailsPage.addToCart();
    await productDetailsPage.viewCartFromModal();
    await cartPage.verifyCartIsOpen();
  });

  await test.step('Verify product quantity in cart', async () => {
    const response = await request.get('/api/productsList');
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.responseCode).toBe(200);

    const product = body.products.find((item: { id: number }) => item.id === Number(productId));
    expect(product, `Product with id ${productId} was not found in API response`).toBeTruthy();

    await cartPage.verifyCartProductsData([
      {
        id: productId,
        name: product.name,
        price: product.price,
        quantity,
        total: `Rs. ${Number(product.price.replace(/[^\d]/g, '')) * quantity}`,
      },
    ]);
  });
});
