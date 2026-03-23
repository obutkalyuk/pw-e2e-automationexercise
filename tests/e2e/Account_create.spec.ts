import { test } from '@playwright/test';
import { User } from '../../data/user';
import { LoginPage } from '../../pages/loginPage';
import { SignupPage } from '../../pages/signupPage';
import { apiHelper } from '../../utils/apiHelper';
import { disposeApiContext } from '../../utils/apiContext';


test('E2E-1: Register User @critical @stable', async ({ page }, testInfo) => {
  const loginPage = new LoginPage(page);
  const signUpPage = new SignupPage(page);
  const USER = User.generateRandom();
  testInfo.annotations.push({
      type: 'Test Data',
      description: `Name: ${USER.name} | Email: ${USER.email} | Password: ${USER.password}`
    });

  await loginPage.goto();
  await test.step(`Sign up new user`, async () => {
    await loginPage.signUp(USER);
    await signUpPage.fillForm(USER);
    await signUpPage.verifyAccountCreation();
    await loginPage.verifyLoginSuccess(USER);
  });
});

test('E2E-5: Register User with existing email @medium', async ({ page, request }, testInfo) => {
  const loginPage = new LoginPage(page);
  const existingUser = await apiHelper.createManagedUser(request, testInfo);

  try {
    await loginPage.goto();

    await test.step(`Try to sign up again with existing email ${existingUser.email}`, async () => {
      await loginPage.signUp(existingUser);
      await loginPage.verifySignupExistingEmailError();
    });
  } finally {
    await apiHelper.deleteUserIfExists(request, existingUser);
    await disposeApiContext();
  }
});
