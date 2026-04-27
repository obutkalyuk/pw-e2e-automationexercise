import { Download, Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { CardDetails } from '../data/payment.data';

export type InvoiceArtifact =
  | {
      kind: 'download';
      content: string;
      suggestedFileName: string;
    }
  | {
      kind: 'inline';
      content: string;
    };

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

  async getInvoiceArtifact(): Promise<InvoiceArtifact> {
    const browserName = this.page.context().browser()?.browserType().name();

    if (browserName === 'webkit') {
      await this.clickAndWaitForUrl(this.downloadInvoiceButton, /\/download_invoice\/\d+/);
      const invoiceContent = (await this.page.locator('body').textContent())?.trim() ?? '';

      return {
        kind: 'inline',
        content: invoiceContent,
      };
    }

    const download = await this.downloadInvoice();
    const suggestedFileName = download.suggestedFilename();
    const stream = await download.createReadStream();

    if (!stream) {
      throw new Error('Downloaded invoice stream is not available');
    }

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return {
      kind: 'download',
      content: Buffer.concat(chunks).toString('utf-8'),
      suggestedFileName,
    };
  }

  async continueAfterOrderPlaced() {
    await this.clickAndWaitForUrl(this.continueButton, '**/');
  }

  async verifyPaymentSuccess() {
    await this.verifyOrderPlaced();
    await this.continueAfterOrderPlaced();
  }
}
