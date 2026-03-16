import { test } from '@playwright/test';
import { User } from '../../data/user';
import { LoginPage } from '../../pages/loginPage';
import { SignupPage } from '../../pages/signupPage';


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
})


