import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './basePage';

export class CheckoutPage  extends BasePage {
    
  readonly cartRows: Locator;
  readonly placeOrderButton: Locator;
  readonly deliveryAddress: Locator;
  readonly billingAddress: Locator;
  readonly orderComments: Locator;
  

  constructor(page: Page) {
    super(page);
    this.cartRows = this.page.locator('#cart_info_table tbody tr');
    this.placeOrderButton = this.page.locator('a.btn.btn-default.check_out');
    this.deliveryAddress = this.page.locator('ul#address_delivery');
    this.billingAddress = this.page.locator('ul#address_invoice');
    this.orderComments = this.page.locator('div#ordermsg textarea[name="message"]');
  }


async getCheckoutData() {
    const products: any[] = [];
    const rows = await this.page.locator('#cart_info_table tbody tr[id^="product-"]').all();

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
            price: price.trim(), 
            quantity: parseInt(quantity),
            total: total.trim()  
        });
    }

    const totalAmount = await this.page.locator('#cart_info_table tbody tr').last().locator('.cart_total_price').innerText();

    return {
        products,
        totalAmount: totalAmount.trim() // Rs. 1900
    };
}

  async verifyCartIsOpen() {
    await expect(this.page.locator('.breadcrumb')).toContainText('Cart');
    await expect(this.cartRows.first()).toBeVisible();
  } 

  async verifyProductInCheckout(products: string[]) { 
    for (const id of products) {
        const productRow = this.page.locator(`tr#product-${id}`);
        await expect(productRow).toBeVisible();
    }
  }

  async placeOrder() {
    await this.placeOrderButton.click();
    await expect(this.placeOrderButton).toBeHidden();  

  }

 }
