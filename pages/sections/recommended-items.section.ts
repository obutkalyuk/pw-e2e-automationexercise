import { expect, Locator, Page } from '@playwright/test';

export class RecommendedItemsSection {
  readonly page: Page;
  readonly section: Locator;
  readonly title: Locator;
  readonly productCards: Locator;
  readonly addToCartButtons: Locator;
  readonly cartModal: Locator;
  readonly viewCartLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.section = page.locator('.recommended_items');
    this.title = this.section.locator('.title.text-center');
    this.productCards = this.section.locator('.single-products');
    this.addToCartButtons = this.section.locator('.productinfo a.add-to-cart');
    this.cartModal = page.locator('#cartModal');
    this.viewCartLink = this.cartModal.locator('a[href="/view_cart"]');
  }

  async verifyRecommendedItemsVisible() {
    await this.section.scrollIntoViewIfNeeded();
    await expect(this.title).toContainText(/recommended items/i);
    await expect(this.productCards.first()).toBeVisible();
    expect(await this.productCards.count()).toBeGreaterThan(0);
  }

  async addProductToCartByNumber(productNumber: number) {
    const addToCartButton = this.addToCartButtons.nth(productNumber - 1);
    const productId = await addToCartButton.getAttribute('data-product-id');

    if (!productId) {
      throw new Error(`Recommended product #${productNumber} has no data-product-id`);
    }

    await addToCartButton.scrollIntoViewIfNeeded();
    await addToCartButton.click({ trial: true });
    await addToCartButton.click();

    return productId;
  }

  async viewCartFromModal() {
    await expect(this.cartModal).toBeVisible();
    await expect(this.viewCartLink).toBeVisible();
    await this.viewCartLink.click({ trial: true });
    await this.viewCartLink.click();
  }
}
