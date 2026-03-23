import { test } from '@playwright/test';
import { User } from '../../data/user';
import { LoginPage } from '../../pages/loginPage';
import { BasePage } from '../../pages/basePage';
import { apiHelper } from '../../utils/apiHelper';
import { disposeApiContext } from '../../utils/apiContext';

test.describe('Logout tests', () => {
  let user: User;

  test.beforeEach(async ({ request }, testInfo) => {
    user = await apiHelper.createManagedUser(request, testInfo);
  });

  test('E2E-4: Logout User (Hybrid) @high', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(user);

    await test.step(`Verify user ${user.name} is logged in`, async () => {
      await loginPage.verifyLoginSuccess(user);
    });

    await test.step('Logout current user', async () => {
      await loginPage.logout();
      await loginPage.verifyLogoutSuccess();
    });
  });

  test.afterEach(async ({ request }) => {
    await apiHelper.deleteUserIfExists(request, user);
    await disposeApiContext();
  });
});
