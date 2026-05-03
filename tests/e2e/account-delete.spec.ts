import { LoginPage } from '../../pages/login.page';
import { SignupPage } from '../../pages/signup.page';
import { test } from '../../utils/fixtures';

test.describe('Account deletion tests', () => {
  test('E2E-27: Delete Account from UI @medium', async ({ page, managedUser }) => {
    const loginPage = new LoginPage(page);
    const signupPage = new SignupPage(page);

    await loginPage.goto();
    await loginPage.login(managedUser);

    await test.step(`Verify user ${managedUser.name} is logged in`, async () => {
      await loginPage.verifyLoginSuccess(managedUser);
    });

    await test.step('Delete current account from navigation menu', async () => {
      await loginPage.deleteAccount();
      await signupPage.verifyAccountDeleted();
    });
  });
});
