import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './basePage';
import { ProductCatalogSection } from './sections/productCatalogSection';
import { ProductSidebarSection } from './sections/productSidebarSection';

export class ProductsPage extends BasePage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly productsTitle: Locator;
  readonly searchedProductsTitle: Locator;
  readonly productCatalog: ProductCatalogSection;
  readonly productSidebar: ProductSidebarSection;
  
  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('#search_product');
    this.searchButton = page.locator('#submit_search');
    this.productsTitle = page.locator('.features_items .title.text-center').first();
    this.searchedProductsTitle = page.locator('.features_items .title.text-center', { hasText: 'Searched Products' });
    this.productCatalog = new ProductCatalogSection(page);
    this.productSidebar = new ProductSidebarSection(page);
  }

  async verifyProductsPageOpen() {
    await expect(this.page).toHaveURL(/\/products/);
    await expect(this.productsTitle).toContainText('All Products');
    await expect(this.productCatalog.productCards.first()).toBeVisible();
  }

  async verifyProductsListVisible() {
    await this.productCatalog.verifyProductsListVisible();
  }

  async openProductDetails(productNumber: number) {
    await this.productCatalog.openProductDetails(productNumber, () => this.handleCommonAds());
  }

  async getProductDetailsId(productNumber: number) {
    return await this.productCatalog.getProductDetailsId(productNumber);
  }

  async searchProduct(searchTerm: string) {
    await this.searchInput.fill(searchTerm);
    await this.searchButton.click();
    await expect(this.page).toHaveURL(/\/products\?search=/);

    const currentUrl = new URL(this.page.url());
    expect(currentUrl.pathname).toBe('/products');
    expect(currentUrl.searchParams.get('search')).toBe(searchTerm);

    await this.handleCommonAds();
  }

  async verifySearchResults(searchTerm: string) {
    await expect(this.page).toHaveURL(/\/products\?search=/);

    const currentUrl = new URL(this.page.url());
    expect(currentUrl.pathname).toBe('/products');
    expect(currentUrl.searchParams.get('search')).toBe(searchTerm);

    await expect(this.searchedProductsTitle).toContainText('Searched Products');
    await expect(this.productCatalog.productCards.first()).toBeVisible();

    const productNames = await this.productCatalog.productNames.allInnerTexts();
    expect(productNames.length).toBeGreaterThan(0);

    for (const productName of productNames) {
      expect(
        productName.toLowerCase(),
        `Product "${productName}" does not contain search term "${searchTerm}"`
      ).toContain(searchTerm.toLowerCase());
    }
  }

  async getVisibleProductIds() {
    return await this.productCatalog.getVisibleProductIds();
  }

  async addProductToCart(productId: string) {
    await this.productCatalog.addProductToCartById(productId, () => this.handleCommonAds());
  }

  async addProductById(productId: string) {
    await this.addProductToCart(productId);
    await this.productCatalog.continueShopping(() => this.handleCommonAds());
  }

  async viewCartFromModal() {
    await this.productCatalog.viewCartFromModal(() => this.handleCommonAds());
  }

  async addMultipleProducts(ids: string[]) {
    for (const id of ids) {
        await this.addProductById(id);
    }
  }
 
 }
