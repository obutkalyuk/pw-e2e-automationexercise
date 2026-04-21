import { LoginPage } from '../../pages/login.page';
import { test } from '../../utils/fixtures';

test.describe('Logout tests', () => {
  test('E2E-4: Logout User @high', async ({ page, managedUser }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(managedUser);

    await test.step(`Verify user ${managedUser.name} is logged in`, async () => {
      await loginPage.verifyLoginSuccess(managedUser);
    });

    await test.step('Logout current user', async () => {
      await loginPage.logout();
      await loginPage.verifyLogoutSuccess();
    });
  });
});
