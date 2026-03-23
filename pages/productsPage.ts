import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './basePage';

export class ProductsPage extends BasePage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly productsTitle: Locator;
  readonly searchedProductsTitle: Locator;
  readonly productCards: Locator;
  readonly productNames: Locator;
  readonly viewProductLinks: Locator;
  readonly continueShoppingButton: Locator;
  readonly viewCartLink: Locator;
  
  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('#search_product');
    this.searchButton = page.locator('#submit_search');
    this.productsTitle = page.locator('.features_items .title.text-center').first();
    this.searchedProductsTitle = page.locator('.features_items .title.text-center', { hasText: 'Searched Products' });
    this.productCards = page.locator('.features_items .single-products');
    this.productNames = page.locator('.features_items .productinfo p');
    this.viewProductLinks = page.locator('.features_items .choose a[href*="/product_details/"]');
    this.continueShoppingButton = page.getByRole('button', { name: 'Continue Shopping' });
    this.viewCartLink = page.locator('#cartModal a[href="/view_cart"]');
  }

  async verifyProductsPageOpen() {
    await expect(this.page).toHaveURL(/\/products/);
    await expect(this.productsTitle).toContainText('All Products');
    await expect(this.productCards.first()).toBeVisible();
  }

  async verifyProductsListVisible() {
    await expect(this.productCards.first()).toBeVisible();
    expect(await this.productCards.count()).toBeGreaterThan(0);
    await expect(this.viewProductLinks.first()).toBeVisible();
  }

  async openProductDetails(productNumber: number) {
    await this.viewProductLinks.nth(productNumber - 1).click();
    await this.handleCommonAds();
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

  async searchProduct(searchTerm: string) {
    await this.searchInput.fill(searchTerm);
    await this.searchButton.click();
    await expect(this.page).toHaveURL(
      url => url.pathname === '/products' && url.searchParams.get('search') === searchTerm
    );
    await this.handleCommonAds();
  }

  async verifySearchResults(searchTerm: string) {
    await expect(this.page).toHaveURL(
      url => url.pathname === '/products' && url.searchParams.get('search') === searchTerm
    );
    await expect(this.searchedProductsTitle).toContainText('Searched Products');
    await expect(this.productCards.first()).toBeVisible();

    const productNames = await this.productNames.allInnerTexts();
    expect(productNames.length).toBeGreaterThan(0);

    for (const productName of productNames) {
      expect(
        productName.toLowerCase(),
        `Product "${productName}" does not contain search term "${searchTerm}"`
      ).toContain(searchTerm.toLowerCase());
    }
  }

  async addProductToCart(productId: string) {
    await this.handleCommonAds();
    await this.page.locator(`.productinfo a[data-product-id="${productId}"]`).click();
  }

  async addProductById(productId: string) {
    await this.addProductToCart(productId);
    await this.continueShoppingButton.click();
  }

  async viewCartFromModal() {
    await this.viewCartLink.click();
    await this.handleCommonAds();
  }

  async addMultipleProducts(ids: string[]) {
    for (const id of ids) {
        await this.addProductById(id);
    }
  }
 
 }
