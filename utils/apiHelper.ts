import { APIRequestContext, expect, test, TestInfo } from '@playwright/test';
import { ProductApiModel } from '../data/product';
import { User } from '../data/user';

export const apiHelper = {
 
  async createUser(request: APIRequestContext, user: User) {
    return await test.step(`API: Create user ${user.email}`, async () => {
      const response = await request.post('/api/createAccount', {
        form: user.toApiForm(),
      });
      
      const body = await response.json();
      
      expect(response.status()).toBe(200);
      expect(body.responseCode, `Creation failed for ${user.email}: ${body.message}`).toBe(201);
      return body;
    });
  },

  /**
 * BUG ALERT: AutomationExercise API always returns HTTP 200 even for failed DELETE requests.
 * We must check the 'responseCode' inside the JSON body instead of response.ok().
 * See GitHub Issue #1 (https://github.com/obutkalyuk/pw-e2e-automationexercise/issues/1) for details.
 */
  async deleteUser(request: APIRequestContext, user: User) {
    return await test.step(`API: Delete user ${user.email}`, async () => {
      const response = await request.delete('/api/deleteAccount', {
        form: {
          email: user.email,
          password: user.password
        }
      });
      
      const body = await response.json();
      
      expect(response.status()).toBe(200);
      expect(body.responseCode, `Deletion failed for ${user.email}: ${body.message}`).toBe(200);
      return body;
    });
  },

  async createManagedUser(request: APIRequestContext, testInfo: TestInfo): Promise<User> {
    const user = User.generateRandom();
    await this.createUser(request, user);
    testInfo.annotations.push({
      type: 'Test Data',
      description: `Name: ${user.name} | Email: ${user.email} | Password: ${user.password}`
    });
    return user;
  },

  async addProductToCart(request: APIRequestContext, productId: string, cookieHeader: string) {
    return await test.step(`API: Add product ${productId} to cart`, async () => {
      const response = await request.get(`/add_to_cart/${productId}`, {
        headers: {
          Cookie: cookieHeader,
        },
      });

      const body = await response.text();

      expect(response.status()).toBe(200);
      return body;
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

  async deleteUserIfExists(request: APIRequestContext, user?: User) {
    if (!user) {
      return;
    }

    await this.deleteUser(request, user);
  }
};
