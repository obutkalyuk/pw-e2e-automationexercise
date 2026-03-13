import { test } from '@playwright/test';
import { apiHelper } from '../../utils/apiHelper';
import { disposeApiContext } from '../../utils/apiContext';
import { User } from '../../data/User';
import { LoginPage } from '../../pages/loginPage';


test.describe('Login tests', () => {
  let testUser: User;

  test.beforeEach(async ({ request }, testInfo) => {
    testUser = User.generateRandom();
    await apiHelper.createUser(request, testUser);
    testInfo.annotations.push({
      type: 'Test Data',
      description: `Name: ${testUser.name} | Email: ${testUser.email} | Password: ${testUser.password}`
    });
  });

  test(`E2E-2: Login User with correct email and password (Hybrid) @smoke @critical`, async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser);

    await test.step(`Verify user ${testUser.name} is logged in`, async () => {
      await loginPage.verifyLoginSuccess(testUser);
    });
  });

test.afterEach(async ({ request }) => {
    await apiHelper.deleteUser(request, testUser);
    await disposeApiContext();
  });
}); 
