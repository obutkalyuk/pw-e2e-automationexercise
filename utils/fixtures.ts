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

export const test = base.extend<Fixtures>({
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
