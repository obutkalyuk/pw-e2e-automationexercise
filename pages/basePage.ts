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
            // Ignore timeout errors - element not present
        }
    }

    async handleCommonAds() {
        const adCloseButton = this.page.locator('div.GoogleActiveViewElement div[aria-label="Close ad"]');
        const promoCloseButton = this.page.locator('div#ad_position_box div#dismiss-button');
        const iframeCloseButton = this.page.locator('iframe[name="ad_iframe"]').contentFrame().getByRole('button', { name: 'Close ad' });
        const consentButton = this.page.getByRole('button', { name: 'Consent' });
        const genericCloseButton = this.page.getByRole('button', { name: /close/i }).or(this.page.getByRole('link', { name: /close/i })).or(this.page.getByText(/close/i)).last();
        await this.clickIfPresent(consentButton);
        await this.clickIfPresent(adCloseButton);
        await this.clickIfPresent(promoCloseButton);
        await this.clickIfPresent(iframeCloseButton);
        await this.clickIfPresent(genericCloseButton);
    }

    protected async handleAdsIfNeeded(adHandler?: () => Promise<void>) {
        if (adHandler) {
            await adHandler();
        }
    }

    protected isOnGoogleVignette() {
        return /#google_vignette$/.test(this.page.url());
    }


    async goToLogin() {
        await this.loginLink.click(); 
        await this.handleCommonAds();
    }
    async goToProducts() { await this.productsLink.click();
        await this.handleCommonAds();
     }
    async goToCart() { await this.cartLink.click(); 
        await this.handleCommonAds();
    }
    async getCookieHeader() {
        const cookies = await this.page.context().cookies();
        return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    }
    async logout() {
        await this.logoutLink.waitFor({ state: 'visible', timeout: 10000 });
        await this.logoutLink.click();
        await this.handleCommonAds();
    }
    async deleteAccount() {await this.deleteAccountLink.click();   
    }

    async verifyLoggedInAs(userName: string) {
        await expect(this.loggedInUserMarker).toBeVisible();
        await expect(this.loggedInUserMarker).toContainText(userName);
  }
}
