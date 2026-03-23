import { test } from '@playwright/test';
import { apiHelper } from '../../utils/apiHelper';
import { disposeApiContext } from '../../utils/apiContext';
import { User } from '../../data/user';
import { LoginPage } from '../../pages/loginPage';


test.describe('Login tests', () => {
  let user: User;

  test.beforeEach(async ({ request }, testInfo) => {
    user = User.generateRandom();
    await apiHelper.createUser(request, user);
    testInfo.annotations.push({
      type: 'Test Data',
      description: `Name: ${user.name} | Email: ${user.email} | Password: ${user.password}`
    });
  });

  test(`E2E-2: Login User with correct email and password (Hybrid) @smoke @critical`, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(user);

    await test.step(`Verify user ${user.name} is logged in`, async () => {
      await loginPage.verifyLoginSuccess(user);
    });
  });

test.afterEach(async ({ request }) => {
    await apiHelper.deleteUser(request, user);
    await disposeApiContext();
  });
}); 
