import { expect, Locator, Page } from '@playwright/test';
import { ContactMessage } from '../data/contact.data';
import { BasePage } from './base.page';

export class ContactPage extends BasePage {
  readonly getInTouchTitle: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly subjectInput: Locator;
  readonly messageInput: Locator;
  readonly uploadFileInput: Locator;
  readonly submitButton: Locator;
  readonly contactForm: Locator;
  readonly successMessage: Locator;
  readonly formHomeLink: Locator;

  constructor(page: Page) {
    super(page);
    this.getInTouchTitle = page.getByRole('heading', { name: 'Get In Touch' });
    this.nameInput = page.locator('input[data-qa="name"]');
    this.emailInput = page.locator('input[data-qa="email"]');
    this.subjectInput = page.locator('input[data-qa="subject"]');
    this.messageInput = page.locator('textarea[data-qa="message"]');
    this.uploadFileInput = page.locator('input[name="upload_file"]');
    this.submitButton = page.locator('input[data-qa="submit-button"]');
    this.contactForm = page.locator('#contact-us-form');
    this.successMessage = page.locator('.status.alert-success');
    this.formHomeLink = page.locator('#form-section').getByRole('link', { name: 'Home' });
  }

  async verifyContactPageOpen() {
    await expect(this.page).toHaveURL(/\/contact_us/);
    await expect(this.getInTouchTitle).toBeVisible();
    await expect(this.contactForm).toBeVisible();
    await this.waitForContactFormScript();
  }

  async submitContactMessage(contactMessage: ContactMessage) {
    await this.nameInput.fill(contactMessage.name);
    await this.emailInput.fill(contactMessage.email);
    await this.subjectInput.fill(contactMessage.subject);
    await this.messageInput.fill(contactMessage.message);
    await this.uploadFileInput.setInputFiles(contactMessage.uploadFilePath);

    const confirmDialog = this.page
      .waitForEvent('dialog', { timeout: 10_000 })
      .then(async (dialog) => {
        await expect(dialog.message()).toBe('Press OK to proceed!');
        await dialog.accept();
      });

    await Promise.all([confirmDialog, this.submitButton.click()]);
  }

  async verifyContactMessageSubmitted() {
    await expect(this.successMessage).toBeVisible();
    await expect(this.successMessage).toContainText(
      'Success! Your details have been submitted successfully.',
    );
  }

  async returnHome() {
    await this.clickAndWaitForUrl(this.formHomeLink, '/');
  }

  private async waitForContactFormScript() {
    await this.page.waitForFunction(() => {
      const pageWindow = window as typeof window & {
        jQuery?: {
          _data?: (
            element: Element | null,
            eventName: string,
          ) => Record<string, unknown[]> | undefined;
        };
      };

      const contactForm = document.querySelector('#contact-us-form');
      const events = pageWindow.jQuery?._data?.(contactForm, 'events');

      return Array.isArray(events?.submit) && events.submit.length > 0;
    });
  }
}
