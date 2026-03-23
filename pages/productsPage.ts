import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './basePage';

export class ProductsPage extends BasePage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly productsTitle: Locator;
  readonly searchedProductsTitle: Locator;
  readonly productCards: Locator;
  readonly productNames: Locator;
  
  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('#search_product');
    this.searchButton = page.locator('#submit_search');
    this.productsTitle = page.locator('.features_items .title.text-center').first();
    this.searchedProductsTitle = page.locator('.features_items .title.text-center', { hasText: 'Searched Products' });
    this.productCards = page.locator('.features_items .single-products');
    this.productNames = page.locator('.features_items .productinfo p');
  }

  async verifyProductsPageOpen() {
    await expect(this.page).toHaveURL(/\/products/);
    await expect(this.productsTitle).toContainText('All Products');
    await expect(this.productCards.first()).toBeVisible();
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

  async addProductById(productId: string) {
    await this.handleCommonAds(); // Handle any ads that may appear before interacting with the product
    await this.page.locator(`.productinfo a[data-product-id="${productId}"]`).click();
    await this.page.getByRole('button', { name: 'Continue Shopping' }).click();
}

  async addMultipleProducts(ids: string[]) {
    for (const id of ids) {
        await this.addProductById(id);
    }
  }
 

  



 }
