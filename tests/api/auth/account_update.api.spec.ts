import { expect, test } from '@playwright/test';
import { User } from '../../../data/user';
import { apiHelper } from '../../../utils/apiHelper';

test.describe('API Account Update', () => {
  test('[API-9] PUT /updateAccount - Update user account details @medium', async ({ request }, testInfo) => {
    const user = await apiHelper.createManagedUser(request, testInfo);
    const updatedUser = User.generateRandom();

    updatedUser.email = user.email;
    updatedUser.password = user.password;

    try {
      const updateResponse = await request.put('/api/updateAccount', {
        form: updatedUser.toApiForm(),
      });
      const updateBody = await updateResponse.json();

      expect(updateResponse.status()).toBe(200);
      expect(updateBody.responseCode).toBe(200);
      expect(updateBody.message).toBe('User updated!');

      const getResponse = await request.get('/api/getUserDetailByEmail', {
        params: { email: user.email },
      });
      const getBody = await getResponse.json();

      expect(getResponse.status()).toBe(200);
      expect(getBody.responseCode).toBe(200);
      expect(getBody.user).toEqual(
        expect.objectContaining({
          name: updatedUser.name,
          email: updatedUser.email,
          first_name: updatedUser.firstName,
          last_name: updatedUser.lastName,
          company: updatedUser.company,
          address1: updatedUser.address,
          country: updatedUser.country,
          state: updatedUser.state,
          city: updatedUser.city,
          zipcode: updatedUser.zipcode,
        })
      );
    } finally {
      await apiHelper.deleteUserIfExists(request, user);
    }
  });
});
