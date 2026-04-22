import { Page, Locator, expect } from '@playwright/test';
import { User } from '../data/user.data';
import { BasePage } from './base.page';

export class SignupPage extends BasePage {
  readonly titleRadio: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly daySelect: Locator;
  readonly monthSelect: Locator;
  readonly yearSelect: Locator;
  readonly newsletterCheckbox: Locator;
  readonly offersCheckbox: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly companyInput: Locator;
  readonly address1Input: Locator;
  readonly address2Input: Locator;
  readonly countrySelect: Locator;
  readonly stateInput: Locator;
  readonly cityInput: Locator;
  readonly zipcodeInput: Locator;
  readonly mobileNumberInput: Locator;
  readonly createAccountButton: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.titleRadio = page.locator('input[name="title"]');
    this.nameInput = page.locator('input[data-qa="name"]');
    this.emailInput = page.locator('input[data-qa="email"]');
    this.passwordInput = page.locator('input[data-qa="password"]');
    this.daySelect = page.locator('select[data-qa="days"]');
    this.monthSelect = page.locator('select[data-qa="months"]');
    this.yearSelect = page.locator('select[data-qa="years"]');
    this.newsletterCheckbox = page.locator('input#newsletter');
    this.offersCheckbox = page.locator('input#optin');
    this.firstNameInput = page.locator('input[data-qa="first_name"]');
    this.lastNameInput = page.locator('input[data-qa="last_name"]');
    this.companyInput = page.locator('input[data-qa="company"]');
    this.address1Input = page.locator('input[data-qa="address"]');
    this.address2Input = page.locator('input[data-qa="address2"]');
    this.countrySelect = page.locator('select[data-qa="country"]');
    this.stateInput = page.locator('input[data-qa="state"]');
    this.cityInput = page.locator('input[data-qa="city"]');
    this.zipcodeInput = page.locator('input[data-qa="zipcode"]');
    this.mobileNumberInput = page.locator('input[data-qa="mobile_number"]');
    this.createAccountButton = page.locator('div.login-form button[data-qa="create-account"]');
    this.continueButton = page.locator('a[data-qa="continue-button"]');
  }

  async selectTitle(title: 'Mr.' | 'Mrs.') {
    if (title === 'Mr.') {
      await this.page.getByLabel('Mr.').check();
    } else {
      await this.page.getByLabel('Mrs.').check();
    }
  }

  async fillForm(user: User) {
    await this.nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.daySelect.waitFor({ state: 'visible', timeout: 10000 });
    await this.monthSelect.waitFor({ state: 'visible', timeout: 10000 });
    await this.yearSelect.waitFor({ state: 'visible', timeout: 10000 });
    await this.newsletterCheckbox.waitFor({ state: 'visible', timeout: 10000 });
    await this.offersCheckbox.waitFor({ state: 'visible', timeout: 10000 });
    await this.firstNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.lastNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.companyInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.address1Input.waitFor({ state: 'visible', timeout: 10000 });
    await this.address2Input.waitFor({ state: 'visible', timeout: 10000 });
    await this.countrySelect.waitFor({ state: 'visible', timeout: 10000 });
    await this.stateInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.cityInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.zipcodeInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.mobileNumberInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.createAccountButton.waitFor({ state: 'visible', timeout: 10000 });

    // Playwright automatically waits for visibility during action (click/fill)
    await this.selectTitle(user.title);
    //await this.nameInput.fill(user.name);
    //await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    await this.daySelect.selectOption(user.dayOfBirth);
    await this.monthSelect.selectOption(user.monthOfBirth);
    await this.yearSelect.selectOption(user.yearOfBirth);
    if (user.newsletter) {
      await this.newsletterCheckbox.check();
    }
    if (user.offers) {
      await this.offersCheckbox.check();
    }
    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.companyInput.fill(user.company);
    await this.address1Input.fill(user.address);
    // address2 is optional, so we can skip filling it
    await this.countrySelect.selectOption({ label: user.country });
    await this.stateInput.fill(user.state);
    await this.cityInput.fill(user.city);
    await this.zipcodeInput.fill(user.zipcode);
    await this.mobileNumberInput.fill(user.mobileNumber);
    await this.clickWhenReady(this.createAccountButton);
    await this.handleCommonAds(); // Handle any ads that may appear after account creation
  }

  async verifyAccountCreation() {
    await expect(this.page).toHaveURL(/.*account_created/, { timeout: 10000 });
    const successMessage = this.page.locator('h2:has-text("Account Created!")');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    await this.clickAndWaitForUrl(this.continueButton, '**/');
  }

  async verifyAccountDeleted() {
    await expect(this.page).toHaveURL(/.*delete_account/, { timeout: 10000 });
    const successMessage = this.page.locator('h2:has-text("Account Deleted!")');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    await this.clickAndWaitForUrl(this.continueButton, '**/');
  }
}
