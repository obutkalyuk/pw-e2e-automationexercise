import { test, expect } from '@playwright/test';
import { User } from '../../../data/user';

test.describe('API Account Management Flow', () => {
  test('[API] Full account lifecycle: create -> details -> verify -> invalid login -> delete @smoke @critical', async ({ request }, testInfo) => {
    const testUser = User.generateRandom();

    console.log(`Run context: ${testInfo.title} | User: ${testUser.email}`);
    testInfo.annotations.push({
      type: 'Test Data',
      description: `Email: ${testUser.email} | Password: ${testUser.password}`
    });

    await test.step(`[API-1] USER CREATION: ${testUser.email}`, async () => {
      const response = await request.post('/api/createAccount', {
        form: testUser.toApiForm(),
      });
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.responseCode, `Response code mismatch for ${testUser.email} Server message: ${body.message}`).toBe(201);
      expect(body.message, 'Server confirmation message').toBe('User created!');
    });

    await test.step(`[API-6] GET USER DETAILS: ${testUser.email}`, async () => {
      const response = await request.get('/api/getUserDetailByEmail', {
        params: { email: testUser.email }
      });
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.responseCode, `FAILED TO GET USER. Email attempted: ${testUser.email} Server message: ${body.message}`).toBe(200);
      expect(body.user.name).toBe(testUser.name);
      expect(body.user.email).toBe(testUser.email);
      expect(body.user.first_name).toBe(testUser.firstName);
    });

    await test.step(`[API-3] VERIFY LOGIN: ${testUser.email}`, async () => {
      const response = await request.post('/api/verifyLogin', {
        form: {
          email: testUser.email,
          password: testUser.password
        }
      });
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.responseCode, `Response code mismatch for ${testUser.email} Server message: ${body.message}`).toBe(200);
      expect(body.message, 'Server confirmation message').toBe('User exists!');
    });

    /* API returns HTTP 200 for 404/400 errors. Testing business logic codes instead of HTTP statuses to maintain CI stability */
    await test.step(`[API-7] VERIFY LOGIN WITH INVALID PASSWORD: ${testUser.email}`, async () => {

      const response = await request.post('/api/verifyLogin', {
        form: {
          email: testUser.email,
          password: 'WrongPassword123!'}
      });
      const body = await response.json();

      expect(response.status(), 'BUG: Server should return 404 for invalid login, but returns 200').toBe(200); 
      expect(body.responseCode, 'Business logic code for User Not Found').toBe(404);
      expect(body.message).toBe('User not found!');
    });

    await test.step(`[API-2] USER DELETE: ${testUser.email}`, async () => {
      const response = await request.delete('/api/deleteAccount', {
        form: {
          email: testUser.email,
          password: testUser.password
        }
      });
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.responseCode, `FAILED TO DELETE USER. Email attempted: ${testUser.email} Server message: ${body.message}`).toBe(200);
      expect(body.message).toBe('Account deleted!');
    });
  });

  test('[API-14] POST /verifyLogin - Reject request without required parameter @medium', async ({ request }) => {
    const response = await request.post('/api/verifyLogin', {
      form: {
        password: 'WrongPassword123!'
      }
    });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.responseCode).toBe(400);
    expect(body.message).toBe('Bad request, email or password parameter is missing in POST request.');
  });

  test('[API-15] DELETE /verifyLogin - Reject unsupported method @medium', async ({ request }) => {
    const response = await request.delete('/api/verifyLogin');
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.responseCode).toBe(405);
    expect(body.message).toBe('This request method is not supported.');
  });
});
