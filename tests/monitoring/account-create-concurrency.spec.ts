import { test, expect } from '@playwright/test';
import { User } from '../../data/user.data';
import { LoginPage } from '../../pages/login.page';
import { SignupPage } from '../../pages/signup.page';
import { applyAdAndConsentMitigation } from '../../utils/fixtures';

test('C-1: Concurrency Probe - User registration under parallel load @low', async ({ browser }) => {
  const taskCount = 10;

  const tasks = Array.from({ length: taskCount }).map(async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await applyAdAndConsentMitigation(context);
    const user = User.generateRandom();

    try {
      const loginPage = new LoginPage(page);
      const signupPage = new SignupPage(page);

      await loginPage.goto();
      await loginPage.signUp(user);
      await signupPage.fillForm(user);

      await expect(page).toHaveURL(/.*account_created/, { timeout: 10_000 });
    } finally {
      await context.close();
    }
  });

  const results = await Promise.allSettled(tasks);
  const failed = results.filter((result) => result.status === 'rejected');

  if (failed.length > 0) {
    throw new Error(`${failed.length} users failed to register under parallel load.`);
  }
});
