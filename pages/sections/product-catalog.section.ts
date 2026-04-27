import { expect, Locator, Page } from '@playwright/test';
import { ProductApiModel } from '../../data/product.data';

export class ProductCatalogSection {
  readonly page: Page;
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly viewProductLinks: Locator;
  readonly cartModal: Locator;
  readonly continueShoppingButton: Locator;
  readonly viewCartLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productCards = page.locator('.features_items .single-products');
    this.productNames = page.locator('.features_items .productinfo p');
    this.viewProductLinks = page.locator('.features_items .choose a[href*="/product_details/"]');
    this.cartModal = page.locator('#cartModal');
    this.continueShoppingButton = page.getByRole('button', { name: 'Continue Shopping' });
    this.viewCartLink = page.locator('#cartModal a[href="/view_cart"]');
  }

  async verifyProductsListVisible() {
    await expect(this.productCards.first()).toBeVisible();
    expect(await this.productCards.count()).toBeGreaterThan(0);
    await expect(this.viewProductLinks.first()).toBeVisible();
  }

  async openProductDetails(productNumber: number) {
    await this.viewProductLinks.nth(productNumber - 1).click();

    if (!this.page.url().includes('/product_details/')) {
      await this.viewProductLinks.nth(productNumber - 1).click();
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

  async addProductToCartById(productId: string) {
    const addToCartButton = this.page.locator(`.productinfo a[data-product-id="${productId}"]`);

    await addToCartButton.scrollIntoViewIfNeeded();
    await addToCartButton.click({ trial: true });
    await addToCartButton.click();
  }

  async addProductToCartByNumber(productNumber: number) {
    const addToCartButton = this.page
      .locator('.features_items .productinfo a.add-to-cart')
      .nth(productNumber - 1);

    await addToCartButton.scrollIntoViewIfNeeded();
    await addToCartButton.click({ trial: true });
    await addToCartButton.click();
  }

  async continueShopping() {
    await expect(this.cartModal).toBeVisible();
    await expect(this.continueShoppingButton).toBeVisible();
    await this.continueShoppingButton.click({ trial: true });
    await this.continueShoppingButton.click();
    await expect(this.cartModal).toBeHidden();
  }

  async viewCartFromModal() {
    await expect(this.cartModal).toBeVisible();
    await expect(this.viewCartLink).toBeVisible();
    await this.viewCartLink.click({ trial: true });
    await this.viewCartLink.click();
  }
}
