import { Page, Locator, expect } from '@playwright/test';
import { CartProduct } from '../data/product';
import { BasePage } from './basePage';

export class CartPage  extends BasePage {
  readonly cartRows: Locator;
  readonly proceedToCheckoutButton: Locator;
  

  constructor(page: Page) {
    super(page);
    this.cartRows = this.page.locator('#cart_info_table tbody tr');
    this.proceedToCheckoutButton = this.page.locator('a.btn.btn-default.check_out');


  }

  async getProducts() {
    const products: any[] = [];
        const rows = await this.cartRows.all();

        for (const row of rows) {
            const fullId = await row.getAttribute('id');
            const id = fullId?.replace('product-', '') || '';

            const name = await row.locator('.cart_description h4 a').innerText();
            const price = await row.locator('.cart_price p').innerText();
            const quantity = await row.locator('.cart_quantity button').innerText();
            const total = await row.locator('.cart_total_price').innerText();

            products.push({
                id: id,
                name: name,
                price: price, 
                quantity: parseInt(quantity), 
                total: total
            });
        }
        return products;
    }

  async proceedToCheckout() {
    await this.proceedToCheckoutButton.click();
  }
 
  async loginFromModal() {
    await this.page.locator('div#checkoutModal a[href="/login"]').click();
    await this.page.waitForURL('**/login');
  }
  

  async deleteProduct(id: string) {
      await this.page.locator(`a.cart_quantity_delete[data-product-id="${id}"]`).click();
      await expect(this.page.locator(`tr#product-${id}`)).toBeHidden();  
  } 

  async verifyCartIsOpen() {
    await expect(this.page.locator('.breadcrumb')).toContainText('Cart');
    await expect(this.cartRows.first()).toBeVisible();
  } 

  async verifyProductInCart(products: string[]) { 
    for (const id of products) {
        const productRow = this.page.locator(`tr#product-${id}`);
        await expect(productRow).toBeVisible();
    }
  }

  async verifyCartProductsData(expectedProducts: CartProduct[]) {
    const actualProducts = await this.getProducts();

    expect(actualProducts).toHaveLength(expectedProducts.length);

    for (const expectedProduct of expectedProducts) {
      const actualProduct = actualProducts.find(product => product.id === expectedProduct.id);

      expect(actualProduct, `Product with id ${expectedProduct.id} was not found in cart`).toBeTruthy();
      expect(actualProduct).toEqual(expectedProduct);
    }
  }
 }
