import { test, expect } from '@playwright/test';
import { apiHelper } from '../../utils/apiHelper';
import { disposeApiContext } from '../../utils/apiContext';
import { User } from '../../data/User';
import { LoginPage } from '../../pages/loginPage';
import { SignupPage } from '../../pages/signupPage';
import { log } from 'node:console';



const BASE_URL = process.env.BASE_URL;



test('E2E-1: Register User', async ({ page }, testInfo) => {
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

  test(`E2E-2: Login User with correct email and password (Hybrid) @smoke`, async ({ page }) => {
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
