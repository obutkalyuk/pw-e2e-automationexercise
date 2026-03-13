import { test, expect } from '@playwright/test';
import { apiHelper } from '../../utils/apiHelper';
import { disposeApiContext } from '../../utils/apiContext';
import { User } from '../../data/User';
import { LoginPage } from '../../pages/loginPage';
import { SignupPage } from '../../pages/signupPage';
import { log } from 'node:console';



const BASE_URL = process.env.BASE_URL;



test.skip('E2E-14: Place Order: Register while Checkout @critical' , async ({ page }, testInfo) => {
  
})


