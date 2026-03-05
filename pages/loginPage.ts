import { Page, Locator, expect } from '@playwright/test';
import { User } from '../data/User';

export class LoginPage {
  readonly page: Page;
  readonly loginEmailInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginButton: Locator;
  readonly signupNameInput: Locator;
  readonly signupEmailInput: Locator;
  readonly signupButton: Locator;
  readonly consentButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginEmailInput = page.locator('input[data-qa="login-email"]');
    this.loginPasswordInput = page.locator('input[data-qa="login-password"]');
    this.loginButton = page.locator('button[data-qa="login-button"]');
    this.signupNameInput = page.locator('input[data-qa="signup-name"]');
    this.signupEmailInput = page.locator('input[data-qa="signup-email"]');
    this.signupButton = page.locator('button[data-qa="signup-button"]');
    this.consentButton = page.getByRole('button', { name: 'Consent' });


  }

  async goto() {
    await this.page.goto('/login');
    if (await this.consentButton.isVisible()) {
      await this.consentButton.click();
      await this.consentButton.waitFor({ state: 'hidden' });
    } 
  }

  async login(user: User) {
    await this.loginEmailInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.loginPasswordInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.loginButton.waitFor({ state: 'visible', timeout: 10000 });

    await this.loginEmailInput.fill(user.email);
    await this.loginPasswordInput.fill(user.password);
    await this.loginButton.click();
  }

  async signUp(user: User) {
    
    await this.signupNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.signupEmailInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.signupButton.waitFor({ state: 'visible', timeout: 10000 });

    await this.signupNameInput.fill(user.name);
    await this.signupEmailInput.fill(user.email);
    await this.signupButton.click();
    }

    async verifyLoginSuccess(user: User) {
      const loggedInMarker = this.page.locator('.navbar-nav li:has-text("Logged in as")');
      await expect(loggedInMarker).toBeVisible({  timeout: 10000 });
      await expect(loggedInMarker).toContainText(user.name);
    }
 }
