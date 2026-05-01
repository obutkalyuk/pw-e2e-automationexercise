import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';
import { ProductCatalogSection } from './sections/product-catalog.section';
import { ProductSidebarSection } from './sections/product-sidebar.section';
import { RecommendedItemsSection } from './sections/recommended-items.section';
import { SubscriptionSection } from './sections/subscription.section';

export class HomePage extends BasePage {
  readonly siteLogo: Locator;
  readonly productCatalog: ProductCatalogSection;
  readonly productSidebar: ProductSidebarSection;
  readonly recommendedItems: RecommendedItemsSection;
  readonly subscription: SubscriptionSection;

  constructor(page: Page) {
    super(page);
    this.siteLogo = page.locator(
      '.logo a img[alt="Website for automation practice"], .logo a img[alt="Website for practice automation"]',
    );
    this.productCatalog = new ProductCatalogSection(page);
    this.productSidebar = new ProductSidebarSection(page);
    this.recommendedItems = new RecommendedItemsSection(page);
    this.subscription = new SubscriptionSection(page);
  }

  async verifyHomePageOpen() {
    await expect(this.page).toHaveURL('/');
    await expect(this.siteLogo).toBeVisible();
    await expect(this.homeLink).toBeVisible();
  }

  async openProductDetails(productNumber: number) {
    await this.productCatalog.openProductDetails(productNumber);
  }

  async addProductToCart(productNumber: number) {
    await this.productCatalog.addProductToCartByNumber(productNumber);
  }

  async addProductByNumber(productNumber: number) {
    await this.addProductToCart(productNumber);
    await this.productCatalog.continueShopping();
  }

  async viewCartFromModal() {
    await this.productCatalog.viewCartFromModal();
  }

  async verifyRecommendedItemsVisible() {
    await this.recommendedItems.verifyRecommendedItemsVisible();
  }

  async addRecommendedProductToCart(productNumber: number) {
    return await this.recommendedItems.addProductToCartByNumber(productNumber);
  }

  async viewCartFromRecommendedModal() {
    await this.recommendedItems.viewCartFromModal();
  }
}
