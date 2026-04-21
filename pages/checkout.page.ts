import { Page, Locator, expect } from '@playwright/test';
import { CartProduct, CheckoutData } from '../data/product.data';
import { User } from '../data/user.data';
import { BasePage } from './base.page';
import { CartTableSection } from './sections/cart-table.section';
import { formatCheckoutAddressLines } from '../utils/address-formatter';

export class CheckoutPage extends BasePage {
  readonly cartRows: Locator;
  readonly placeOrderButton: Locator;
  readonly deliveryAddress: Locator;
  readonly billingAddress: Locator;
  readonly orderComments: Locator;
  readonly cartTable: CartTableSection;

  constructor(page: Page) {
    super(page);
    this.cartTable = new CartTableSection(page);
    this.cartRows = this.cartTable.rows;
    this.placeOrderButton = this.page.locator('a.btn.btn-default.check_out');
    this.deliveryAddress = this.page.locator('ul#address_delivery');
    this.billingAddress = this.page.locator('ul#address_invoice');
    this.orderComments = this.page.locator('div#ordermsg textarea[name="message"]');
  }

  async getCheckoutData(): Promise<CheckoutData> {
    const products: CartProduct[] = await this.cartTable.getProducts();

    const totalAmount = await this.page
      .locator('#cart_info_table tbody tr')
      .last()
      .locator('.cart_total_price')
      .innerText();

    return {
      products,
      totalAmount: totalAmount.trim(), // Rs. 1900
    };
  }

  async verifyCartIsOpen() {
    await expect(this.page.locator('.breadcrumb')).toContainText('Cart');
    await expect(this.cartRows.first()).toBeVisible();
  }

  async verifyProductInCheckout(products: string[]) {
    await this.cartTable.verifyProductIds(products);
  }

  async verifyAddressDetails(user: User) {
    const expectedLines = formatCheckoutAddressLines(user);

    for (const line of expectedLines) {
      await expect(this.deliveryAddress).toContainText(line);
      await expect(this.billingAddress).toContainText(line);
    }
  }

  async placeOrder() {
    await this.placeOrderButton.click();
    await expect(this.placeOrderButton).toBeHidden();
  }
}
