import { User } from '../../data/user';
import { LoginPage } from '../../pages/loginPage';
import { SignupPage } from '../../pages/signupPage';
import { test } from '../../utils/fixtures';

test('E2E-1: Register User @critical @stable', async ({ page, createdUserCleanup }, testInfo) => {
  const loginPage = new LoginPage(page);
  const signUpPage = new SignupPage(page);
  const USER = User.generateRandom();
  createdUserCleanup.track(USER);
  testInfo.annotations.push({
    type: 'Test Data',
    description: `Name: ${USER.name} | Email: ${USER.email} | Password: ${USER.password}`,
  });

  await loginPage.goto();
  await test.step(`Sign up new user`, async () => {
    await loginPage.signUp(USER);
    await signUpPage.fillForm(USER);
    await signUpPage.verifyAccountCreation();
    await loginPage.verifyLoginSuccess(USER);
  });
});

test('E2E-5: Register User with existing email @medium', async ({ page, managedUser }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();

  await test.step(`Try to sign up again with existing email ${managedUser.email}`, async () => {
    await loginPage.signUp(managedUser);
    await loginPage.verifySignupExistingEmailError();
  });
});
