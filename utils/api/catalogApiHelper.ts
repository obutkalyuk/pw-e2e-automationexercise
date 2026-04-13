import { APIRequestContext, expect, test } from '@playwright/test';
import { ProductApiModel } from '../../data/product';

export const catalogApiHelper = {
  async getProductById(request: APIRequestContext, productId: string): Promise<ProductApiModel> {
    return await test.step(`API: Get product ${productId} from products list`, async () => {
      const products = await this.getProductsList(request);
      const product = products.find((item) => String(item.id) === productId);

      expect(product, `Product ${productId} should exist in products list`).toBeTruthy();
      return product!;
    });
  },

  async getProductsList(request: APIRequestContext): Promise<ProductApiModel[]> {
    return await test.step('API: Get products list', async () => {
      const response = await request.get('/api/productsList');
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.responseCode).toBe(200);

      return body.products as ProductApiModel[];
    });
  },
};
