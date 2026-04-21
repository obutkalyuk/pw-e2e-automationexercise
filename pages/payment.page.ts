import { Download, Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { CardDetails } from '../data/payment.data';

export class PaymentPage extends BasePage {
  readonly nameOnCardInput: Locator;
  readonly cardNumberInput: Locator;
  readonly cvcInput: Locator;
  readonly expiryMonthInput: Locator;
  readonly expiryYearInput: Locator;
  readonly payButton: Locator;
  readonly orderPlacedHeading: Locator;
  readonly downloadInvoiceButton: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.nameOnCardInput = page.locator('#payment-form input[data-qa=name-on-card]');
    this.cardNumberInput = page.locator('#payment-form input[data-qa=card-number]');
    this.cvcInput = page.locator('#payment-form input[data-qa=cvc]');
    this.expiryMonthInput = page.locator('#payment-form input[data-qa=expiry-month]');
    this.expiryYearInput = page.locator('#payment-form input[data-qa=expiry-year]');
    this.payButton = page.locator('#payment-form button[data-qa=pay-button]');
    this.orderPlacedHeading = page.locator('h2', { hasText: 'Order Placed!' });
    this.downloadInvoiceButton = page.getByRole('link', { name: 'Download Invoice' });
    this.continueButton = page.locator('a[data-qa="continue-button"]');
  }

  private async fillField(locator: Locator, value: string) {
    await locator.fill(value);
  }

  async fillPaymentDetails(details: CardDetails) {
    await this.fillField(this.nameOnCardInput, details.holder);
    await this.fillField(this.cardNumberInput, details.number);
    await this.fillField(this.cvcInput, details.cvc);
    await this.fillField(this.expiryMonthInput, details.expiryMonth);
    await this.fillField(this.expiryYearInput, details.expiryYear);
  }

  async clickPayAndConfirm() {
    await this.payButton.click();
    await this.handleCommonAds(); // Handle any ads that may appear after payment
  }

  async verifyOrderPlaced() {
    await expect(this.page).toHaveURL(/.*payment_done/, { timeout: 20000 });
    await expect(this.orderPlacedHeading).toBeVisible({ timeout: 10000 });
  }

  async downloadInvoice(): Promise<Download> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.downloadInvoiceButton.click();
    return await downloadPromise;
  }

  async continueAfterOrderPlaced() {
    await this.clickAndWaitForUrl(this.continueButton, '**/');
  }

  async verifyPaymentSuccess() {
    await this.verifyOrderPlaced();
    await this.continueAfterOrderPlaced();
  }
}
