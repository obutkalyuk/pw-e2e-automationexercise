import { expect, Locator, Page } from '@playwright/test';
import { CartProduct } from '../../data/product.data';

export class CartTableSection {
  readonly page: Page;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.rows = page.locator('#cart_info_table tbody tr[id^="product-"]');
  }

  async getProducts(): Promise<CartProduct[]> {
    const products: CartProduct[] = [];
    const rows = await this.rows.all();

    for (const row of rows) {
      const fullId = await row.getAttribute('id');
      const id = fullId?.replace('product-', '') || '';

      const name = await row.locator('.cart_description h4 a').innerText();
      const price = await row.locator('.cart_price p').innerText();
      const quantity = await row.locator('.cart_quantity button').innerText();
      const total = await row.locator('.cart_total_price').innerText();

      products.push({
        id,
        name,
        price: price.trim(),
        quantity: parseInt(quantity, 10),
        total: total.trim(),
      });
    }

    return products;
  }

  async verifyProductIds(productIds: string[]) {
    for (const id of productIds) {
      await expect(this.page.locator(`tr#product-${id}`)).toBeVisible();
    }
  }
}
