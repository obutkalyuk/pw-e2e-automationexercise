import { readFile, writeFile } from 'fs/promises';
import path from 'path';

export type ContactMessageData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactMessage = ContactMessageData & {
  uploadFilePath: string;
};

export const contactMessageData: ContactMessageData = {
  name: 'QA Contact',
  email: 'qa.contact@example.com',
  subject: 'Contact us form smoke check',
  message: 'The contact form should accept text fields and an uploaded file.',
};

const contactMessageTemplatePath = path.resolve(__dirname, 'contact-message.txt');

export async function createContactMessageUploadFile(
  uploadFilePath: string,
  fileName: string,
  runStartedAt: string,
  testTitle: string,
) {
  const template = await readFile(contactMessageTemplatePath, 'utf-8');
  const content = [
    template.trim(),
    `File name: ${fileName}`,
    `Run started at: ${runStartedAt}`,
    `Test title: ${testTitle}`,
  ].join('\n');

  await writeFile(uploadFilePath, content, 'utf-8');
}
