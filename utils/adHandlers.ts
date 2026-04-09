import { Locator, Page } from '@playwright/test';

async function clickIfVisible(locator: Locator) {
  if (await locator.isVisible().catch(() => false)) {
    await locator.click().catch(() => {});
  }
}

export async function registerCommonAdHandlers(page: Page) {
  const consentButton = page.getByRole('button', { name: /consent|accept/i }).last();
  const adCloseButton = page.locator('div.GoogleActiveViewElement div[aria-label="Close ad"]');
  const promoCloseButton = page.locator('div#ad_position_box div#dismiss-button');
  const genericCloseButton = page
    .getByRole('button', { name: /close/i })
    .or(page.getByRole('link', { name: /close/i }))
    .or(page.getByText(/close/i))
    .last();

  await page.addLocatorHandler(consentButton, async locator => {
    await clickIfVisible(locator);
  });

  await page.addLocatorHandler(adCloseButton, async locator => {
    await clickIfVisible(locator);
  });

  await page.addLocatorHandler(promoCloseButton, async locator => {
    await clickIfVisible(locator);
  });

  await page.addLocatorHandler(genericCloseButton, async locator => {
    await clickIfVisible(locator);
  });
}
