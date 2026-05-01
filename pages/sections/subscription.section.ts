import { expect, Locator, Page } from '@playwright/test';

export class SubscriptionSection {
  readonly page: Page;
  readonly footer: Locator;
  readonly subscriptionTitle: Locator;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.footer = page.locator('#footer');
    this.subscriptionTitle = this.footer.getByRole('heading', { name: /subscription/i });
    this.emailInput = this.footer.locator('#susbscribe_email');
    this.submitButton = this.footer.locator('#subscribe');
    this.successMessage = this.footer.locator('#success-subscribe .alert-success');
  }

  async verifySubscriptionVisible() {
    await this.footer.scrollIntoViewIfNeeded();
    await expect(this.subscriptionTitle).toBeVisible();
    await expect(this.subscriptionTitle).toHaveText(/subscription/i);
  }

  async submitSubscription(email: string) {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }

  async verifySubscriptionSubmitted() {
    await expect(this.successMessage).toBeVisible();
    await expect(this.successMessage).toHaveText('You have been successfully subscribed!');
  }
}
