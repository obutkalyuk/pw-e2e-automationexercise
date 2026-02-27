import { Page, test } from '@playwright/test';
import { User } from '../data/User';
import { LoginPage } from '../pages/loginPage';



export async function login(
  page: Page,
  user: User,
  proposalId: string,
  milestoneId: number
) {
  const loginPage = new LoginPage(page);

  await test.step(`Login as ${user.username}`, async () => {
    await loginPage.goto();
    await loginPage.loginAsUser(user);
  });

  await test.step(`Go to milestone page`, async () => {
    await page.goto(`/projects/${proposalId}/milestones/${milestoneId}`);
  });
}

