import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { ProductCatalogSection } from './sections/product-catalog.section';
import { ProductSidebarSection } from './sections/product-sidebar.section';

export class HomePage extends BasePage {
  readonly siteLogo: Locator;
  readonly productCatalog: ProductCatalogSection;
  readonly productSidebar: ProductSidebarSection;

  constructor(page: Page) {
    super(page);
    this.siteLogo = page.locator(
      '.logo a img[alt="Website for automation practice"], .logo a img[alt="Website for practice automation"]',
    );
    this.productCatalog = new ProductCatalogSection(page);
    this.productSidebar = new ProductSidebarSection(page);
  }

  async verifyHomePageOpen() {
    await expect(this.page).toHaveURL('/');
    await expect(this.siteLogo).toBeVisible();
    await expect(this.homeLink).toBeVisible();
  }

  async openProductDetails(productNumber: number) {
    await this.productCatalog.openProductDetails(productNumber, () => this.handleCommonAds());
  }

  async addProductToCart(productNumber: number) {
    await this.productCatalog.addProductToCartByNumber(productNumber, () => this.handleCommonAds());
  }

  async addProductByNumber(productNumber: number) {
    await this.addProductToCart(productNumber);
    await this.productCatalog.continueShopping(() => this.handleCommonAds());
  }

  async viewCartFromModal() {
    await this.productCatalog.viewCartFromModal(() => this.handleCommonAds());
  }
}
