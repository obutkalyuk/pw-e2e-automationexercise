import { Page, Locator, expect } from '@playwright/test';
import { CartProduct } from '../data/product.data';
import { BasePage } from './base.page';
import { CartTableSection } from './sections/cart-table.section';

export class CartPage extends BasePage {
  readonly cartRows: Locator;
  readonly proceedToCheckoutButton: Locator;
  readonly checkoutModal: Locator;
  readonly loginFromCheckoutModalLink: Locator;
  readonly cartTable: CartTableSection;

  constructor(page: Page) {
    super(page);
    this.cartTable = new CartTableSection(page);
    this.cartRows = this.cartTable.rows;
    this.proceedToCheckoutButton = this.page.locator('a.btn.btn-default.check_out');
    this.checkoutModal = this.page.locator('div#checkoutModal');
    this.loginFromCheckoutModalLink = this.checkoutModal.locator('a[href="/login"]');
  }

  async getProducts(): Promise<CartProduct[]> {
    return await this.cartTable.getProducts();
  }

  async proceedToCheckout() {
    await this.proceedToCheckoutButton.click();
  }

  async loginFromModal() {
    await this.loginFromCheckoutModalLink.waitFor({ state: 'visible', timeout: 15000 });
    await this.clickAndWaitForUrl(this.loginFromCheckoutModalLink, '**/login');
  }

  async deleteProduct(id: string) {
    const deleteProductLink = this.page.locator(`a.cart_quantity_delete[data-product-id="${id}"]`);

    await this.clickWhenReady(deleteProductLink);
    await expect(this.page.locator(`tr#product-${id}`)).toBeHidden();
  }

  async verifyCartIsOpen() {
    await expect(this.page.locator('.breadcrumb')).toContainText('Cart');
    await expect(this.cartRows.first()).toBeVisible();
  }

  async verifyProductInCart(products: string[]) {
    await this.cartTable.verifyProductIds(products);
  }

  async verifyCartProductsData(expectedProducts: CartProduct[]) {
    const actualProducts = await this.getProducts();

    expect(actualProducts).toHaveLength(expectedProducts.length);

    for (const expectedProduct of expectedProducts) {
      const actualProduct = actualProducts.find((product) => product.id === expectedProduct.id);

      expect(
        actualProduct,
        `Product with id ${expectedProduct.id} was not found in cart`,
      ).toBeTruthy();
      expect(actualProduct).toEqual(expectedProduct);
    }
  }
}
