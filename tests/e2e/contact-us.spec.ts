import { TestInfo } from '@playwright/test';
import { basename } from 'path';
import { contactMessageData, createContactMessageUploadFile } from '../../data/contact.data';
import { ContactPage } from '../../pages/contact.page';
import { HomePage } from '../../pages/home.page';
import { test } from '../../utils/fixtures';

async function createContactMessage(testInfo: TestInfo) {
  const runStartedAt = new Date().toISOString();
  const uploadFileName = `contact-message-${runStartedAt.replace(/[:.]/g, '-')}.txt`;
  const uploadFilePath = testInfo.outputPath(uploadFileName);
  const contactMessage = {
    ...contactMessageData,
    subject: `${contactMessageData.subject} ${runStartedAt}`,
    uploadFilePath,
  };

  await createContactMessageUploadFile(
    uploadFilePath,
    basename(uploadFilePath),
    runStartedAt,
    testInfo.title,
  );

  testInfo.annotations.push({
    type: 'Test Data',
    description: `Name: ${contactMessage.name} | Email: ${contactMessage.email} | Subject: ${contactMessage.subject}`,
  });

  return contactMessage;
}

test('E2E-6: Contact Us Form @low', async ({ page }, testInfo) => {
  const homePage = new HomePage(page);
  const contactPage = new ContactPage(page);
  const contactMessage = await createContactMessage(testInfo);

  await test.step('Navigate to home page and verify', async () => {
    await page.goto('/');
    await homePage.verifyHomePageOpen();
  });

  await test.step('Open contact us page', async () => {
    await homePage.goToContact();
    await contactPage.verifyContactPageOpen();
  });

  await test.step('Submit contact message with uploaded file', async () => {
    await contactPage.submitContactMessage(contactMessage);
    await contactPage.verifyContactMessageSubmitted();
  });

  await test.step('Return to home page', async () => {
    await contactPage.returnHome();
    await homePage.verifyHomePageOpen();
  });
});

test('[BUG-41] Contact Us form should send message data to the server @high', async ({
  page,
}, testInfo) => {
  test.fail(
    true,
    'Known defect (#41): Contact Us submit handler returns false after showing a success message, so no POST /contact_us request is sent.',
  );

  const homePage = new HomePage(page);
  const contactPage = new ContactPage(page);
  const contactMessage = await createContactMessage(testInfo);

  await page.goto('/');
  await homePage.goToContact();
  await contactPage.verifyContactPageOpen();

  const contactSubmitRequest = page.waitForRequest(
    (request) => {
      const requestUrl = new URL(request.url());

      return request.method() === 'POST' && requestUrl.pathname === '/contact_us';
    },
    { timeout: 3_000 },
  );

  await contactPage.submitContactMessage(contactMessage);
  await contactSubmitRequest;
});
