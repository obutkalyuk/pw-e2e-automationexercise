import { User } from '../../data/user.data';
import { LoginPage } from '../../pages/login.page';
import { test } from '../../utils/fixtures';

test.describe('Login tests', () => {
  test(`E2E-2: Login User with correct email and password @smoke @critical`, async ({
    page,
    managedUser,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(managedUser);

    await test.step(`Verify user ${managedUser.name} is logged in`, async () => {
      await loginPage.verifyLoginSuccess(managedUser);
    });
  });

  test('E2E-3: Login User with incorrect email and password @high', async ({
    page,
    managedUser,
  }) => {
    const loginPage = new LoginPage(page);
    const invalidUser = Object.assign(new User(), managedUser, {
      password: 'WrongPassword123!',
    });
    await loginPage.goto();
    await loginPage.login(invalidUser);

    await test.step(`Verify login fails for user ${managedUser.email}`, async () => {
      await loginPage.verifyLoginFailure();
    });
  });
});
