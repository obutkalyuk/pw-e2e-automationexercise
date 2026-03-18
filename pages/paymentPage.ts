import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './basePage';
import { CardDetails } from '../data/payment';

export class PaymentPage  extends BasePage {
    readonly nameOnCardInput: Locator;
    readonly cardNumberInput: Locator;
    readonly cvcInput: Locator;
    readonly expiryMonthInput: Locator;
    readonly expiryYearInput: Locator;
    readonly payButton: Locator;
    readonly successMessage: Locator;

    constructor(page: Page) {
        super(page);
        this.nameOnCardInput = page.locator('#payment-form input[data-qa=name-on-card]'); 
        this.cardNumberInput = page.locator('#payment-form input[data-qa=card-number]');
        this.cvcInput = page.locator('#payment-form input[data-qa=cvc]');
        this.expiryMonthInput = page.locator('#payment-form input[data-qa=expiry-month]');
        this.expiryYearInput = page.locator('#payment-form input[data-qa=expiry-year]');
        this.payButton = page.locator('#payment-form button[data-qa=pay-button]');
        this.successMessage = page.locator('#success_message');
    }

    async fillPaymentDetails(details: CardDetails) {
        await this.nameOnCardInput.fill(details.holder);
        await this.cardNumberInput.fill(details.number);
        await this.cvcInput.fill(details.cvc);
        await this.expiryMonthInput.fill(details.expiryMonth);
        await this.expiryYearInput.fill(details.expiryYear);
}

    async clickPayAndConfirm() {
        await this.payButton.click();
        await this.handleCommonAds(); // Handle any ads that may appear after payment
        
    }

 async verifyPaymentSuccess() {
    await expect(this.page).toHaveURL(/.*payment_done/, { timeout: 20000 });
    const successMessage = this.page.locator('h2:has-text("Order Placed!")');
    await expect(successMessage).toBeVisible({  timeout: 10000 });
    await this.page.locator('a[data-qa="continue-button"]').click();
  } 
    async getSuccessMessage() {
        return await this.successMessage.innerText();
    }
}