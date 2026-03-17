import { test } from '@playwright/test';
import { apiHelper } from '../../utils/apiHelper';
import { disposeApiContext } from '../../utils/apiContext';
import { User } from '../../data/user';
import { LoginPage } from '../../pages/loginPage';
import { ProductsPage } from '../../pages/productsPage';
import { CartPage } from '../../pages/cartPage';
import { CheckoutPage } from '../../pages/checkoutPage';
import { PaymentPage } from '../../pages/paymentPage';
import { TEST_CARD } from '../../data/payment';


test.skip('E2E-14: Place Order: Register while Checkout @critical' , async ({ page }, testInfo) => {
  
})

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



test('E2E-15: Place Order: Register before Checkout @critical', async ({ page, request }, testinfo) => {
    const productPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const loginPage = new LoginPage(page);

    const products = ["1", "3", "5"];

    await page.goto('/products');
    await productPage.addMultipleProducts(products); 
    
    await productPage.goToCart();
   
    await cartPage.proceedToCheckout();
    await cartPage.loginFromModal();

    await loginPage.login(testUser);
    await loginPage.goToCart(); 

    await cartPage.verifyProductInCart(products);
});

test('E2E-16: Place Order: Login before Checkout @critical' , async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    const productPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const paymentPage = new PaymentPage(page);

    const products = ["2", "4", "6"];

    await loginPage.goto();
    await loginPage.login(testUser);
    await loginPage.goToProducts();
    await productPage.addMultipleProducts(products); 
    await productPage.goToCart();

    await cartPage.verifyProductInCart(products);
    await cartPage.proceedToCheckout();
    await checkoutPage.verifyProductInCheckout(products);
    await checkoutPage.placeOrder();
    await paymentPage.fillPaymentDetails(TEST_CARD);
    await paymentPage.clickPayAndConfirm(); 

})

test.afterEach(async ({ request }) => {
    await apiHelper.deleteUser(request, testUser);
    await disposeApiContext();
  });
}); 

