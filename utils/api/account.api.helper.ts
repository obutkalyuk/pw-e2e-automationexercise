import { APIRequestContext, expect, test, TestInfo } from '@playwright/test';
import { User } from '../../data/user.data';

export const accountApiHelper = {
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
    // Test-targeted delete: use when DELETE /api/deleteAccount itself is the behavior under test.
    // This path is strict and expects a successful business outcome (responseCode 200).
    return await test.step(`API: Delete user ${user.email}`, async () => {
      const response = await request.delete('/api/deleteAccount', {
        form: {
          email: user.email,
          password: user.password,
        },
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
      description: `Name: ${user.name} | Email: ${user.email} | Password: ${user.password}`,
    });
    return user;
  },

  async deleteUserIfExists(request: APIRequestContext, user?: User) {
    if (!user) {
      return;
    }

    // Cleanup delete: use in fixtures/teardown where the user may already be gone.
    // This path is intentionally tolerant and accepts both "deleted" (200) and "not found" (404).
    await test.step(`API: Delete user if exists ${user.email}`, async () => {
      const response = await request.delete('/api/deleteAccount', {
        form: {
          email: user.email,
          password: user.password,
        },
      });
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(
        [200, 404],
        `Unexpected deletion response for ${user.email}: ${body.message}`,
      ).toContain(body.responseCode);
    });
  },
};
