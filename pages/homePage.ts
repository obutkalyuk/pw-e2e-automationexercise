import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './basePage';

export class HomePage extends BasePage {
  readonly siteLogo: Locator;

  constructor(page: Page) {
    super(page);
    this.siteLogo = page.locator('.logo a img[alt="Website for automation practice"], .logo a img[alt="Website for practice automation"]');
  }

  async verifyHomePageOpen() {
    await expect(this.page).toHaveURL('/');
    await expect(this.siteLogo).toBeVisible();
    await expect(this.homeLink).toBeVisible();
  }
}
