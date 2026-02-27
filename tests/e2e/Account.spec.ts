import { test, expect } from '@playwright/test';
import { User } from '../../data/User';
import { LoginPage } from '../../pages/loginPage';

const BASE_URL = process.env.BASE_URL;


test('test', async ({ page }) => {
  const USER = User.generateRandom();
  await page.goto(BASE_URL!);
  await page.getByRole('button', { name: 'Consent' }).click();
  await page.getByRole('link', { name: ' Signup / Login' }).click();
  await page.getByRole('textbox', { name: 'Name' }).click();
  await page.getByRole('textbox', { name: 'Name' }).fill(USER.name);
  await page.locator('form').filter({ hasText: 'Signup' }).getByPlaceholder('Email Address').click();
  await page.locator('form').filter({ hasText: 'Signup' }).getByPlaceholder('Email Address').fill(USER.email);
  await page.getByRole('button', { name: 'Signup' }).click();
  await page.getByRole('radio', { name: 'Mr.' }).check();
  await page.getByRole('textbox', { name: 'Name *', exact: true }).click();
  await page.getByRole('textbox', { name: 'Password *' }).click();
  await page.getByRole('textbox', { name: 'Password *' }).fill(USER.password);
  await console.log(USER.email, USER.password);
  await page.locator('#days').selectOption(USER.dayOfBirth);
  await page.locator('#months').selectOption(USER.monthOfBirth);
  await page.locator('#years').selectOption(USER.yearOfBirth);
  await page.getByRole('checkbox', { name: 'Sign up for our newsletter!' }).check();
  await page.getByRole('checkbox', { name: 'Receive special offers from' }).check();
  await page.getByRole('textbox', { name: 'First name *' }).click();
  await page.getByRole('textbox', { name: 'First name *' }).click();
  await page.getByRole('textbox', { name: 'First name *' }).fill(USER.firstName);
  await page.getByRole('textbox', { name: 'First name *' }).press('Tab');
  await page.getByRole('textbox', { name: 'Last name *' }).fill(USER.lastName);
  await page.getByRole('textbox', { name: 'Company', exact: true }).click();
  await page.getByRole('textbox', { name: 'Company', exact: true }).fill(USER.company);
  await page.getByRole('textbox', { name: 'Address * (Street address, P.' }).click();
  await page.getByRole('textbox', { name: 'Address * (Street address, P.' }).click();
  await page.getByRole('textbox', { name: 'Address * (Street address, P.' }).fill('2 Wartnaby Road AILEY HR3 6NZ');
  await page.getByLabel('Country *').selectOption('United States');
  await page.locator('div').filter({ hasText: 'Enter Account Information' }).nth(1).click();
  await page.getByLabel('Country *').selectOption('New Zealand');
  await page.getByRole('textbox', { name: 'State *' }).click();
  await page.getByRole('textbox', { name: 'State *' }).fill(USER.state);
  await page.getByRole('textbox', { name: 'City * Zipcode *' }).click();
  await page.getByRole('textbox', { name: 'City * Zipcode *' }).fill(USER.city);
  await page.locator('#zipcode').click();
  await page.locator('#zipcode').fill(USER.zipcode);
  await page.getByRole('textbox', { name: 'Mobile Number *' }).click();
  await page.getByRole('textbox', { name: 'Mobile Number *' }).fill('(026) 4252-415');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.getByRole('link', { name: 'Continue' }).click();
  await page.getByText(`Logged in as ${USER.name}`).click();
  await page.getByRole('link', { name: ' Delete Account' }).click();
  await page.getByRole('link', { name: 'Continue' }).click();
});

test('Test Case 1: Register User', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const USER = User.generateRandom();
  await page.goto(BASE_URL!);
  await test.step(``, async () => {
    await loginPage.signUp(USER);
  });})