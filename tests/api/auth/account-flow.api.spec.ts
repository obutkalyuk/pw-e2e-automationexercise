import { test, expect, type APIRequestContext } from '@playwright/test';
import { userDetailResponseSchema } from '../../../data/api-schemas.data';
import { User } from '../../../data/user.data';
import { accountApiHelper } from '../../../utils/api/account.api.helper';

async function createAccount(request: APIRequestContext, testUser: User) {
  const response = await request.post('/api/createAccount', {
    form: testUser.toApiForm(),
  });
  const body = await response.json();

  expect(response.status()).toBe(200);
  expect(
    body.responseCode,
    `Response code mismatch for ${testUser.email} Server message: ${body.message}`,
  ).toBe(201);
  expect(body.message, 'Server confirmation message').toBe('User created!');
}

async function deleteAccount(request: APIRequestContext, testUser: User) {
  const response = await request.delete('/api/deleteAccount', {
    form: {
      email: testUser.email,
      password: testUser.password,
    },
  });
  const body = await response.json();

  expect(response.status()).toBe(200);
  expect(
    body.responseCode,
    `FAILED TO DELETE USER. Email attempted: ${testUser.email} Server message: ${body.message}`,
  ).toBe(200);
  expect(body.message).toBe('Account deleted!');
}

test.describe('API Account Management Flow', () => {
  test('[API-1] POST /createAccount - Create user account @critical', async ({
    request,
  }, testInfo) => {
    const testUser = User.generateRandom();

    console.log(`Run context: ${testInfo.title} | User: ${testUser.email}`);
    testInfo.annotations.push({
      type: 'Test Data',
      description: `Email: ${testUser.email} | Password: ${testUser.password}`,
    });

    await createAccount(request, testUser);
    await deleteAccount(request, testUser);
  });

  test('[API-6] GET /getUserDetailByEmail - Get user account detail @high', async ({
    request,
  }, testInfo) => {
    const testUser = User.generateRandom();

    console.log(`Run context: ${testInfo.title} | User: ${testUser.email}`);
    testInfo.annotations.push({
      type: 'Test Data',
      description: `Email: ${testUser.email} | Password: ${testUser.password}`,
    });

    await createAccount(request, testUser);

    await test.step(`[API-6] GET USER DETAILS: ${testUser.email}`, async () => {
      const response = await request.get('/api/getUserDetailByEmail', {
        params: { email: testUser.email },
      });
      const body = userDetailResponseSchema.parse(await response.json());

      expect(response.status()).toBe(200);
      expect(
        body.responseCode,
        `FAILED TO GET USER. Email attempted: ${testUser.email} Server message: ${body.message}`,
      ).toBe(200);
      expect(body.user.name).toBe(testUser.name);
      expect(body.user.email).toBe(testUser.email);
      expect(body.user.first_name).toBe(testUser.firstName);
    });

    await deleteAccount(request, testUser);
  });

  test('[API-3] POST /verifyLogin - Verify login with valid details @critical @smoke', async ({
    request,
  }, testInfo) => {
    const testUser = User.generateRandom();

    console.log(`Run context: ${testInfo.title} | User: ${testUser.email}`);
    testInfo.annotations.push({
      type: 'Test Data',
      description: `Email: ${testUser.email} | Password: ${testUser.password}`,
    });

    await createAccount(request, testUser);

    await test.step(`[API-3] VERIFY LOGIN: ${testUser.email}`, async () => {
      const response = await request.post('/api/verifyLogin', {
        form: {
          email: testUser.email,
          password: testUser.password,
        },
      });
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(
        body.responseCode,
        `Response code mismatch for ${testUser.email} Server message: ${body.message}`,
      ).toBe(200);
      expect(body.message, 'Server confirmation message').toBe('User exists!');
    });

    await deleteAccount(request, testUser);
  });

  test('[API-7] POST /verifyLogin - Login with invalid details @medium', async ({
    request,
  }, testInfo) => {
    const testUser = User.generateRandom();

    console.log(`Run context: ${testInfo.title} | User: ${testUser.email}`);
    testInfo.annotations.push({
      type: 'Test Data',
      description: `Email: ${testUser.email} | Password: ${testUser.password}`,
    });

    await createAccount(request, testUser);

    /* Known API bug (#1): server returns HTTP 200 for business-error responses. */
    await test.step(`[API-7] VERIFY LOGIN WITH INVALID PASSWORD: ${testUser.email}`, async () => {
      const response = await request.post('/api/verifyLogin', {
        form: {
          email: testUser.email,
          password: 'WrongPassword123!',
        },
      });
      const body = await response.json();

      expect(
        response.status(),
        'Known API bug (#1): server returns HTTP 200 for business-error responses.',
      ).toBe(200);
      expect(body.responseCode, 'Business logic code for User Not Found').toBe(404);
      expect(body.message).toBe('User not found!');
    });

    await deleteAccount(request, testUser);
  });

  test('[API-2] DELETE /deleteAccount - Delete user account @critical', async ({
    request,
  }, testInfo) => {
    const testUser = User.generateRandom();

    console.log(`Run context: ${testInfo.title} | User: ${testUser.email}`);
    testInfo.annotations.push({
      type: 'Test Data',
      description: `Email: ${testUser.email} | Password: ${testUser.password}`,
    });

    await createAccount(request, testUser);
    await deleteAccount(request, testUser);
  });

  test('[API-14] POST /verifyLogin - Reject request without required parameter @medium', async ({
    request,
  }) => {
    const response = await request.post('/api/verifyLogin', {
      form: {
        password: 'WrongPassword123!',
      },
    });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.responseCode).toBe(400);
    expect(body.message).toBe(
      'Bad request, email or password parameter is missing in POST request.',
    );
  });

  test('[API-15] DELETE /verifyLogin - Reject unsupported method @medium', async ({ request }) => {
    const response = await request.delete('/api/verifyLogin');
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.responseCode).toBe(405);
    expect(body.message).toBe('This request method is not supported.');
  });

  test('[API-16] POST /createAccount - Reject invalid or incomplete account data @low', async ({
    request,
  }) => {
    const response = await request.post('/api/createAccount', {
      form: {
        name: 'Broken User',
        email: `broken_${Date.now()}@example.com`,
        password: 'Test1234',
      },
    });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.responseCode).toBe(400);
    expect(body.message).toBe('Bad request, firstname parameter is missing in POST request.');
  });

  test('[API-27] POST /createAccount - Reject impossible date of birth @medium', async ({
    request,
  }, testInfo) => {
    test.fail(
      true,
      'Known defect (#51): POST /createAccount accepts and persists impossible date-of-birth values.',
    );

    const testUser = User.generateRandom();

    testUser.title = 'Mr.';
    testUser.name = ' Test1 User';
    testUser.dayOfBirth = ' 99,';
    testUser.monthOfBirth = ' 99,';
    testUser.yearOfBirth = '-1990,';
    testUser.firstName = "'John',";
    testUser.lastName = "'Doe',";
    testUser.company = "'QA Inc',";
    testUser.address = "'Main Street 1',";
    testUser.state = "'California',";
    testUser.city = "'Los Angeles',";
    testUser.zipcode = "'90001',";

    testInfo.annotations.push({
      type: 'Test Data',
      description: `Email: ${testUser.email} | DOB: ${testUser.dayOfBirth}/${testUser.monthOfBirth}/${testUser.yearOfBirth}`,
    });

    try {
      const response = await request.post('/api/createAccount', {
        form: testUser.toApiForm(),
      });
      const body = await response.json();

      testInfo.annotations.push({
        type: 'Finding',
        description: `createAccount=http:${response.status()},responseCode:${body.responseCode},message:${body.message}`,
      });

      const detailResponse = await request.get('/api/getUserDetailByEmail', {
        params: { email: testUser.email },
      });
      const detailBody = await detailResponse.json();
      const persistedUser =
        typeof detailBody.user === 'object' && detailBody.user !== null
          ? (detailBody.user as Record<string, unknown>)
          : null;

      testInfo.annotations.push({
        type: 'Finding',
        description: [
          `getUserDetail=http:${detailResponse.status()},responseCode:${detailBody.responseCode}`,
          `message:${detailBody.message ?? '<missing>'}`,
          `birth_day:${persistedUser?.birth_day ?? '<missing>'}`,
          `birth_month:${persistedUser?.birth_month ?? '<missing>'}`,
          `birth_year:${persistedUser?.birth_year ?? '<missing>'}`,
          `first_name:${persistedUser?.first_name ?? '<missing>'}`,
          `last_name:${persistedUser?.last_name ?? '<missing>'}`,
        ].join(' | '),
      });

      expect(response.status()).toBe(200);
      expect(body.responseCode).toBe(400);
      expect(body.message).toContain('birth');
      expect(detailResponse.status()).toBe(200);
      expect(
        detailBody.responseCode,
        'Account with invalid date of birth should not be persisted',
      ).toBe(404);
    } finally {
      await accountApiHelper.deleteUserIfExists(request, testUser);
    }
  });

  test('[API-17] DELETE /deleteAccount - Reject delete with invalid credentials @low', async ({
    request,
  }) => {
    const user = User.generateRandom();

    const response = await request.delete('/api/deleteAccount', {
      form: {
        email: user.email,
        password: user.password,
      },
    });
    const body = await response.json();

    expect(
      response.status(),
      'Known API bug (#1): server returns HTTP 200 for business-error responses.',
    ).toBe(200);
    expect(body.responseCode).toBe(404);
    expect(body.message).toBe('Account not found!');
  });
});
