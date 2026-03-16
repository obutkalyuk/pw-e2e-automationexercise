import { APIRequestContext, expect, test } from '@playwright/test';
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
  }
};