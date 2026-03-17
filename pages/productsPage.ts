import { Page } from '@playwright/test';
import { BasePage } from './basePage';

export class ProductsPage extends BasePage {
  
  constructor(page: Page) {
    super(page);
  }

  async addProductById(productId: string) {
    await this.closeConsentIfPresent();
    await this.page.locator(`.productinfo a[data-product-id="${productId}"]`).click();
    await this.page.getByRole('button', { name: 'Continue Shopping' }).click();
}

  async addMultipleProducts(ids: string[]) {
    for (const id of ids) {
        await this.addProductById(id);
    }
  }
 

  



 }
