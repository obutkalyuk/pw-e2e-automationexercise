import { test as base } from '@playwright/test';
import { User } from '../data/user';
import { apiHelper } from './apiHelper';

type CreatedUserCleanup = {
  track: (user: User) => void;
};

type Fixtures = {
  managedUser: User;
  createdUserCleanup: CreatedUserCleanup;
};

const TARGETED_AD_BLOCK_HOSTS = new Set([
  'pagead2.googlesyndication.com',
  'tpc.googlesyndication.com',
  'googleads.g.doubleclick.net',
  'googleads4.g.doubleclick.net',
  'ep1.adtrafficquality.google',
  'ep2.adtrafficquality.google',
  'cm.g.doubleclick.net',
  's0.2mdn.net',
]);

export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    await page.context().route('**/*', async (route) => {
      const requestUrl = route.request().url();
      let parsedUrl: URL | null = null;

      try {
        parsedUrl = new URL(requestUrl);
      } catch {
        parsedUrl = null;
      }

      if (!parsedUrl || !['http:', 'https:'].includes(parsedUrl.protocol)) {
        await route.continue();
        return;
      }

      if (TARGETED_AD_BLOCK_HOSTS.has(parsedUrl.hostname)) {
        await route.abort();
        return;
      }

      await route.continue();
    });

    await use(page);
  },

  managedUser: async ({ request }, use, testInfo) => {
    const user = await apiHelper.createManagedUser(request, testInfo);
    await use(user);
    await apiHelper.deleteUserIfExists(request, user);
  },

  createdUserCleanup: async ({ request }, use) => {
    let userToDelete: User | undefined;

    await use({
      track: (user: User) => {
        userToDelete = user;
      }
    });

    await apiHelper.deleteUserIfExists(request, userToDelete);
  }
});
