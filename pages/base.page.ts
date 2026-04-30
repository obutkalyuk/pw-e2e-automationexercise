import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly homeLink: Locator;
  readonly productsLink: Locator;
  readonly cartLink: Locator;
  readonly loginLink: Locator;
  readonly contactLink: Locator;
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
    this.contactLink = this.menuContainer.getByRole('link', { name: 'Contact us' });
    this.logoutLink = this.menuContainer.getByRole('link', { name: 'Logout' });
    this.deleteAccountLink = this.menuContainer.getByRole('link', { name: 'Delete Account' });
    this.loggedInUserMarker = this.menuContainer.locator('li').filter({ hasText: 'Logged in as' });
  }

  protected async clickWhenReady(locator: Locator) {
    await locator.scrollIntoViewIfNeeded();
    await locator.click({ trial: true });
    await locator.click({ noWaitAfter: true });
  }

  protected async clickAndWaitForUrl(locator: Locator, url: string | RegExp) {
    await locator.scrollIntoViewIfNeeded();
    await locator.click({ trial: true });
    await Promise.all([
      this.page.waitForURL(url, { waitUntil: 'domcontentloaded' }),
      locator.click({ noWaitAfter: true }),
    ]);
  }

  protected isOnGoogleVignette() {
    return /#google_vignette$/.test(this.page.url());
  }

  private async navigateFromMenu(link: Locator) {
    await link.click();
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
  async goToContact() {
    await this.clickAndWaitForUrl(this.contactLink, /\/contact_us/);
  }
  async getCookieHeader() {
    const cookies = await this.page.context().cookies();
    return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
  }
  async logout() {
    await this.logoutLink.waitFor({ state: 'visible', timeout: 10000 });
    await this.clickAndWaitForUrl(this.logoutLink, '**/login');
  }
  async deleteAccount() {
    await this.clickAndWaitForUrl(this.deleteAccountLink, '**/delete_account');
  }

  async verifyLoggedInAs(userName: string) {
    await expect(this.loggedInUserMarker).toBeVisible();
    await expect(this.loggedInUserMarker).toContainText(userName);
  }
}
