import { Page, Locator, expect } from '@playwright/test';
import { User } from '../data/user';
import { BasePage } from './basePage';

export class LoginPage extends BasePage {
  readonly loginEmailInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginButton: Locator;
  readonly loginErrorMessage: Locator;
  readonly signupNameInput: Locator;
  readonly signupEmailInput: Locator;
  readonly signupButton: Locator;
  readonly signupErrorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.loginEmailInput = page.locator('input[data-qa="login-email"]');
    this.loginPasswordInput = page.locator('input[data-qa="login-password"]');
    this.loginButton = page.locator('button[data-qa="login-button"]');
    this.loginErrorMessage = page.locator('form[action="/login"]').filter({ hasText: 'incorrect' });
    this.signupNameInput = page.locator('input[data-qa="signup-name"]');
    this.signupEmailInput = page.locator('input[data-qa="signup-email"]');
    this.signupButton = page.locator('button[data-qa="signup-button"]');
    this.signupErrorMessage = page.locator('form[action="/signup"] p');
  }

  async goto() {
    await this.page.goto('/login');
    await this.handleCommonAds();
  }

  async login(user: User) {
    await this.loginEmailInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.loginPasswordInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.loginButton.waitFor({ state: 'visible', timeout: 10000 });

    await this.loginEmailInput.fill(user.email);
    await this.loginPasswordInput.fill(user.password);
    await this.loginButton.click({ force: true });
    //await expect(this.loginButton).toBeHidden();
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
    await expect(loggedInMarker).toBeVisible({ timeout: 20000 });
    await expect(loggedInMarker).toContainText(user.name);
  }

  async verifyLoginFailure() {
    await expect(this.loginErrorMessage).toBeVisible({ timeout: 10000 });
    await expect(this.loginErrorMessage).toContainText('Your email or password is incorrect!');
    await expect(this.loggedInUserMarker).toBeHidden();
  }

  async verifySignupExistingEmailError() {
    await expect(this.signupErrorMessage).toBeVisible({ timeout: 10000 });
    await expect(this.signupErrorMessage).toContainText('Email Address already exist!');
  }

  async verifyLogoutSuccess() {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.loginLink).toBeVisible({ timeout: 10000 });
    await expect(this.loginEmailInput).toBeVisible({ timeout: 10000 });
    await expect(this.loginButton).toBeVisible({ timeout: 10000 });
    await expect(this.loggedInUserMarker).toBeHidden();
    await expect(this.logoutLink).toBeHidden();
  }
}
