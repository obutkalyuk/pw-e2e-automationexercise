import { test, expect } from '@playwright/test';
import { User } from '../../../data/User';

test.describe.configure({ mode: 'serial' });
test.describe('API Account Management Flow', () => {
  // Generate one user for whole chain
  const testUser = User.generateRandom();
  test.beforeEach(async ({}, testInfo) => {
    console.log(`Run context: ${testInfo.title} | User: ${testUser.email}`);
    
    testInfo.annotations.push({
      type: 'Test Data',
      description: `Email: ${testUser.email} | Password: ${testUser.password}`
    });
  });

  test('[API-1] POST /createAccount - Create user account @smoke ', async ({ request }) => {
    await test.step(`USER CREATION: ${testUser.email}`, async () => {
      const response = await request.post('/api/createAccount', { 
        form: testUser.toApiForm(),
      });
    const body = await response.json();
    
      expect(response.status()).toBe(200);
      expect(body.responseCode, `Response code mismatch for ${testUser.email} Server message: ${body.message}`).toBe(201);
      expect(body.message, 'Server confirmation message').toBe('User created!');
      
    });
  });

  test('[API-6] GET /getUserDetailByEmail - Get user account detail @high ', async ({ request }) => {
    await test.step(`GET USER DETAILS: ${testUser.email}`, async () => {

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
  });

  test('[API-2] DELETE /deleteAccount - Delete user account @smoke ', async ({ request }) => {
    await test.step(`USER DELETE: ${testUser.email}`, async () => {
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
});