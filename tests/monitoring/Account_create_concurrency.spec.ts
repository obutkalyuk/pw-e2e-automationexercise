import { test, expect } from '@playwright/test';
import { User } from '../../data/user';
import { LoginPage } from '../../pages/loginPage';
import { SignupPage } from '../../pages/signupPage';
  
test.skip(({ browserName }) => browserName !== 'chromium',  'This bug is Chromium-specific');
test('Concurrency Trap: Catching the 200 OK bug', async ({ browser }) => {
  test.fail(true, 'BUG-###: Race condition returns 200 OK');
    // create 5 users at the same time
    const taskCount = 5;
    
    const tasks = Array.from({ length: taskCount }).map(async (_, i) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        const USER = User.generateRandom(); 

        try {
            const USER = User.generateRandom(); 
            const loginPage = new LoginPage(page);
            const signupPage = new SignupPage(page);
            
            await loginPage.goto();
            await loginPage.signUp(USER);
            await signupPage.fillForm(USER); 

            await expect(page).toHaveURL(/.*account_created/, { timeout: 10000 });
        } finally {
            await context.close();
        }
    });

    // Wait until all 5 attempts completed (either success or failure)
    const results = await Promise.allSettled(tasks);
    
    // Check if any of the attempts failed
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
        throw new Error(`${failed.length} users failed to register due to race condition.`);
    }
});


