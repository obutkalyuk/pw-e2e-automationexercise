import { APIRequestContext, expect, test } from '@playwright/test';
import { User } from '../data/User';

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