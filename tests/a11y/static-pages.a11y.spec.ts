import { expect } from '@playwright/test';
import type { Result } from 'axe-core';
import { User } from '../../data/user.data';
import { ContactPage } from '../../pages/contact.page';
import { HomePage } from '../../pages/home.page';
import { LoginPage } from '../../pages/login.page';
import { ProductDetailsPage } from '../../pages/product-details.page';
import { ProductsPage } from '../../pages/products.page';
import { test } from '../../utils/fixtures';
import { analyzePage, formatViolations } from './a11y-analysis.helper';

test('[A11Y-1] Home page has no critical or serious static a11y violations @a11y-smoke', async ({
  page,
}, testInfo) => {
  testInfo.annotations.push({ type: 'Page', description: '/' });
  test.fail(
    true,
    'Known a11y defects: #54 footer subscribe button has no accessible name, #55 site-wide color contrast failures, #57 footer social media links have no accessible name.',
  );
  const homePage = new HomePage(page);
  let violations: Result[] = [];

  await test.step('navigate', async () => {
    await page.goto('/');
    await homePage.verifyHomePageOpen();
  });

  await test.step('analyze', async () => {
    violations = await analyzePage(page);
  });

  await test.step('assert', async () => {
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });
});

test('[A11Y-2] Login page has no critical or serious static a11y violations @a11y-smoke', async ({
  page,
}, testInfo) => {
  testInfo.annotations.push({ type: 'Page', description: '/login' });
  test.fail(
    true,
    'Known a11y defects: #54 footer subscribe button has no accessible name, #55 site-wide color contrast failures.',
  );
  const loginPage = new LoginPage(page);
  let violations: Result[] = [];

  await test.step('navigate', async () => {
    await loginPage.goto();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.signupButton).toBeVisible();
  });

  await test.step('analyze', async () => {
    violations = await analyzePage(page);
  });

  await test.step('assert', async () => {
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });
});

test('[A11Y-3] Signup form has no critical or serious static a11y violations @a11y-smoke', async ({
  page,
}, testInfo) => {
  testInfo.annotations.push({ type: 'Page', description: '/signup' });
  test.fail(
    true,
    'Known a11y defects: #54 footer subscribe button has no accessible name, #55 site-wide color contrast failures, #56 signup form inputs are missing associated labels, #58 signup title/date-of-birth dropdowns have no accessible name.',
  );
  const loginPage = new LoginPage(page);
  const signupUser = User.generateRandom();
  let violations: Result[] = [];

  await test.step('navigate', async () => {
    await loginPage.goto();
  });

  await test.step('setup', async () => {
    await loginPage.signUp(signupUser);
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.locator('button[data-qa="create-account"]')).toBeVisible();
  });

  await test.step('analyze', async () => {
    violations = await analyzePage(page);
  });

  await test.step('assert', async () => {
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });
});

test('[A11Y-4] Products list page has no critical or serious static a11y violations @a11y-smoke', async ({
  page,
}, testInfo) => {
  testInfo.annotations.push({ type: 'Page', description: '/products' });
  test.fail(
    true,
    'Known a11y defects: #54 footer subscribe/search buttons have no accessible name, #55 site-wide color contrast failures.',
  );
  const productsPage = new ProductsPage(page);
  let violations: Result[] = [];

  await test.step('navigate', async () => {
    await page.goto('/products');
    await productsPage.verifyProductsPageOpen();
  });

  await test.step('analyze', async () => {
    violations = await analyzePage(page);
  });

  await test.step('assert', async () => {
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });
});

test('[A11Y-5] Product detail page has no critical or serious static a11y violations @a11y-smoke', async ({
  page,
}, testInfo) => {
  testInfo.annotations.push({ type: 'Page', description: '/product_details/1' });
  test.fail(
    true,
    'Known a11y defects: #54 footer subscribe button has no accessible name, #55 site-wide color contrast failures, #56 product review form input is missing an associated label.',
  );
  const productDetailsPage = new ProductDetailsPage(page);
  let violations: Result[] = [];

  await test.step('navigate', async () => {
    await page.goto('/product_details/1');
    await productDetailsPage.verifyProductDetailsPageOpen();
  });

  await test.step('analyze', async () => {
    violations = await analyzePage(page);
  });

  await test.step('assert', async () => {
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });
});

test('[A11Y-6] Contact Us page has no critical or serious static a11y violations @a11y-smoke', async ({
  page,
}, testInfo) => {
  testInfo.annotations.push({ type: 'Page', description: '/contact_us' });
  test.fail(
    true,
    'Known a11y defects: #54 footer subscribe button has no accessible name, #55 site-wide color contrast failures, #56 Contact Us file input is missing an associated label.',
  );
  const contactPage = new ContactPage(page);
  let violations: Result[] = [];

  await test.step('navigate', async () => {
    await page.goto('/contact_us');
    await contactPage.verifyContactPageOpen();
  });

  await test.step('analyze', async () => {
    violations = await analyzePage(page);
  });

  await test.step('assert', async () => {
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });
});
