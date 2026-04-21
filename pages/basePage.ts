import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly homeLink: Locator;
  readonly productsLink: Locator;
  readonly cartLink: Locator;
  readonly loginLink: Locator;
  readonly logoutLink: Locator;
  readonly deleteAccountLink: Locator;
  readonly menuContainer: Locator;
  readonly loggedInUserMarker: Locator;

  constructor(page: Page) {
    this.page = page;
    this.menuContainer = page.locator('.shop-menu');
    this.homeLink = this.menuContainer.getByRole('link', { name: 'Home' });
    this.productsLink = this.menuContainer.getByRole('link', { name: 'Products' });
    this.cartLink = this.menuContainer.getByRole('link', { name: 'Cart' });
    this.loginLink = this.menuContainer.getByRole('link', { name: 'Signup / Login' });
    this.logoutLink = this.menuContainer.getByRole('link', { name: 'Logout' });
    this.deleteAccountLink = this.menuContainer.getByRole('link', { name: 'Delete Account' });
    this.loggedInUserMarker = this.menuContainer.locator('li').filter({ hasText: 'Logged in as' });
  }

  private async clickIfPresent(locator: Locator, timeout = 3000) {
    try {
      if (await locator.isVisible({ timeout })) {
        await locator.click();
      }
    } catch (e) {
      if (this.page.isClosed()) {
        return;
      }
      if (e instanceof Error && /timeout|timed out/i.test(e.message)) {
        return;
      }
      throw e;
    }
  }

  async handleCommonAds() {
    // Third-party ad traffic is now blocked at the network layer in the shared fixture.
    // Keep this method as a no-op for now so existing page-object calls stay intact
    // while we validate that the old click-based ad handling is no longer needed.
  }

  protected async handleAdsIfNeeded(adHandler?: () => Promise<void>) {
    if (adHandler) {
      await adHandler();
    }
  }

  protected isOnGoogleVignette() {
    return /#google_vignette$/.test(this.page.url());
  }

  private async navigateFromMenu(link: Locator) {
    await this.handleCommonAds();
    await link.click();
    await this.handleCommonAds();
  }

  async goToLogin() {
    await this.navigateFromMenu(this.loginLink);
  }
  async goToProducts() {
    await this.navigateFromMenu(this.productsLink);
  }
  async goToCart() {
    await this.navigateFromMenu(this.cartLink);
  }
  async getCookieHeader() {
    const cookies = await this.page.context().cookies();
    return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
  }
  async logout() {
    await this.logoutLink.waitFor({ state: 'visible', timeout: 10000 });
    await this.logoutLink.click();
    await this.handleCommonAds();
  }
  async deleteAccount() {
    await this.deleteAccountLink.click();
  }

  async verifyLoggedInAs(userName: string) {
    await expect(this.loggedInUserMarker).toBeVisible();
    await expect(this.loggedInUserMarker).toContainText(userName);
  }
}
