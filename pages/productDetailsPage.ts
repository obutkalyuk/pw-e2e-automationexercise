import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';

type ProductApiModel = {
  id: number;
  name: string;
  price: string;
  brand: string;
  category: {
    usertype: {
      usertype: string;
    };
    category: string;
  };
};

export class ProductDetailsPage extends BasePage {
  readonly productName: Locator;
  readonly categoryText: Locator;
  readonly priceText: Locator;
  readonly availabilityText: Locator;
  readonly conditionText: Locator;
  readonly brandText: Locator;

  constructor(page: Page) {
    super(page);
    this.productName = page.locator('.product-information h2');
    this.categoryText = page.locator('.product-information p', { hasText: 'Category:' });
    this.priceText = page.locator('.product-information span span').filter({ hasText: 'Rs.' });
    this.availabilityText = page.locator('.product-information p', { hasText: 'Availability:' });
    this.conditionText = page.locator('.product-information p', { hasText: 'Condition:' });
    this.brandText = page.locator('.product-information p', { hasText: 'Brand:' });
  }

  async verifyProductDetailsPageOpen() {
    await expect(this.page).toHaveURL(/\/product_details\//);
    await expect(this.productName).toBeVisible();
    await expect(this.categoryText).toBeVisible();
    await expect(this.priceText).toBeVisible();
    await expect(this.availabilityText).toBeVisible();
    await expect(this.conditionText).toBeVisible();
    await expect(this.brandText).toBeVisible();
  }

  async verifyProductDetailsContent(product: ProductApiModel) {
    await expect(this.productName).toHaveText(product.name);
    await expect(this.categoryText).toContainText(
      `Category: ${product.category.usertype.usertype} > ${product.category.category}`
    );
    await expect(this.priceText).toHaveText(product.price);
    await expect(this.availabilityText).toContainText('In Stock');
    await expect(this.conditionText).toContainText('New');
    await expect(this.brandText).toContainText(product.brand);
  }
}
