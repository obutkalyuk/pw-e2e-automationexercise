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
        this.nameOnCardInput = page.locator('name=name-on-card');
        this.cardNumberInput = page.locator('data-qa=card-number');
        this.cvcInput = page.locator('data-qa=cvc');
        this.expiryMonthInput = page.locator('data-qa=expiry-month');
        this.expiryYearInput = page.locator('data-qa=expiry-year');
        this.payButton = page.locator('data-qa=pay-button');
        
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
        await expect(this.payButton).toBeHidden();  
        
    }


    async getSuccessMessage() {
        return await this.successMessage.innerText();
    }
}