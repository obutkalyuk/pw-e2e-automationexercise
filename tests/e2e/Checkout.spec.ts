import { test } from '@playwright/test';
import { apiHelper } from '../../utils/apiHelper';
import { disposeApiContext } from '../../utils/apiContext';
import { User } from '../../data/user';
import { LoginPage } from '../../pages/loginPage';
import { ProductsPage } from '../../pages/productsPage';
import { CartPage } from '../../pages/cartPage';




const BASE_URL = process.env.BASE_URL;

test.describe('Place Order tests', () => {
  let testUser: User;

  test.beforeEach(async ({ request }, testInfo) => {
    testUser = User.generateRandom();
    await apiHelper.createUser(request, testUser);
    testInfo.annotations.push({
      type: 'Test Data',
      description: `Name: ${testUser.name} | Email: ${testUser.email} | Password: ${testUser.password}`
    });
  });

test.skip('E2E-14: Place Order: Register while Checkout @critical' , async ({ page }, testInfo) => {
  
})

test('E2E-15: Place Order: Register before Checkout @critical', async ({ page, request }, testinfo) => {
    const products = ["1", "3", "5"];
    const productPage = new ProductsPage(page);

    await page.goto('/products');
    await productPage.addMultipleProducts(products); 
    await productPage.goToCart();

    const cartPage = new CartPage(page);
    await cartPage.proceedToCheckout();
    await cartPage.loginFromModal();

    const loginPage = new LoginPage(page);
    await loginPage.login(testUser);

    await loginPage.goToCart(); 

    await cartPage.verifyProductInCart(products);
});

test.skip('E2E-16: Place Order: Login before Checkout @critical' , async ({ page }, testInfo) => {

  
})

test.afterEach(async ({ request }) => {
    await apiHelper.deleteUser(request, testUser);
    await disposeApiContext();
  });
}); 

