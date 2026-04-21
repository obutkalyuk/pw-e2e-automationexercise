import { expect, Locator, Page } from '@playwright/test';
import { ProductApiModel } from '../../data/product.data';

export class ProductCatalogSection {
  readonly page: Page;
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly viewProductLinks: Locator;
  readonly continueShoppingButton: Locator;
  readonly viewCartLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productCards = page.locator('.features_items .single-products');
    this.productNames = page.locator('.features_items .productinfo p');
    this.viewProductLinks = page.locator('.features_items .choose a[href*="/product_details/"]');
    this.continueShoppingButton = page.getByRole('button', { name: 'Continue Shopping' });
    this.viewCartLink = page.locator('#cartModal a[href="/view_cart"]');
  }

  async verifyProductsListVisible() {
    await expect(this.productCards.first()).toBeVisible();
    expect(await this.productCards.count()).toBeGreaterThan(0);
    await expect(this.viewProductLinks.first()).toBeVisible();
  }

  async openProductDetails(productNumber: number, handleCommonAds: () => Promise<void>) {
    await this.viewProductLinks.nth(productNumber - 1).click();
    await handleCommonAds();

    if (!this.page.url().includes('/product_details/')) {
      await this.viewProductLinks.nth(productNumber - 1).click();
      await handleCommonAds();
    }
  }

  async getProductDetailsId(productNumber: number) {
    const href = await this.viewProductLinks.nth(productNumber - 1).getAttribute('href');
    if (!href) {
      throw new Error(`Product details link for product #${productNumber} has no href`);
    }

    const match = href.match(/\/product_details\/(\d+)/);
    if (!match) {
      throw new Error(`Could not extract product id from href: ${href}`);
    }

    return match[1];
  }

  async getVisibleProductIds() {
    const productIds = await this.page
      .locator('.features_items .productinfo a.add-to-cart')
      .evaluateAll((elements) =>
        elements
          .map((element) => element.getAttribute('data-product-id'))
          .filter((value): value is string => Boolean(value)),
      );

    return [...new Set(productIds)];
  }

  async verifyVisibleProductsMatchBrand(products: ProductApiModel[], brandName: string) {
    const visibleProductIds = await this.getVisibleProductIds();
    expect(visibleProductIds.length).toBeGreaterThan(0);

    for (const productId of visibleProductIds) {
      const product = products.find((item) => item.id === Number(productId));

      expect(product, `Product with id ${productId} was not found in API response`).toBeTruthy();
      expect(product!.brand).toBe(brandName);
    }
  }

  async verifyVisibleProductsMatchCategory(
    products: ProductApiModel[],
    categoryName: string,
    subcategoryName: string,
  ) {
    const visibleProductIds = await this.getVisibleProductIds();
    expect(visibleProductIds.length).toBeGreaterThan(0);

    for (const productId of visibleProductIds) {
      const product = products.find((item) => item.id === Number(productId));

      expect(product, `Product with id ${productId} was not found in API response`).toBeTruthy();
      expect(product!.category.usertype.usertype).toBe(categoryName);
      expect(product!.category.category).toBe(subcategoryName);
    }
  }

  async addProductToCartById(productId: string, handleCommonAds: () => Promise<void>) {
    await handleCommonAds();
    await this.page.locator(`.productinfo a[data-product-id="${productId}"]`).click();
  }

  async addProductToCartByNumber(productNumber: number, handleCommonAds: () => Promise<void>) {
    await handleCommonAds();
    await this.page
      .locator('.features_items .productinfo a.add-to-cart')
      .nth(productNumber - 1)
      .click();
  }

  async continueShopping(handleCommonAds: () => Promise<void>) {
    await this.continueShoppingButton.click();
    await expect(this.continueShoppingButton).toBeHidden();
    await handleCommonAds();
  }

  async viewCartFromModal(handleCommonAds: () => Promise<void>) {
    await this.viewCartLink.click();
    await handleCommonAds();
  }
}
