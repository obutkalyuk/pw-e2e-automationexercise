import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
    readonly page: Page;
    readonly homeLink: Locator;
    readonly productsLink: Locator;
    readonly cartLink: Locator;
    readonly loginLink: Locator;
    readonly logoutLink: Locator;
    readonly deleteAccountLink: Locator;
    readonly consentButton: Locator;
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
        
        this.consentButton = page.getByRole('button', { name: 'Consent' });
    }

    async closeConsentIfPresent() {
        try {
            if (await this.consentButton.isVisible({ timeout: 3000 })) {
                await this.consentButton.click();
            }
        } catch (e) {
        }
    }

    async goToLogin() {
        await this.loginLink.click(); 
        await this.closeConsentIfPresent();
    }
    async goToProducts() { await this.productsLink.click();
        await this.closeConsentIfPresent();
     }
    async goToCart() { await this.cartLink.click(); 
        await this.closeConsentIfPresent();
    }
    async deleteAccount() {await this.deleteAccountLink.click();   
    }

    async verifyLoggedInAs(userName: string) {
        await expect(this.loggedInUserMarker).toBeVisible();
        await expect(this.loggedInUserMarker).toContainText(userName);
  }
}