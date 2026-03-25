import { test, expect } from '@playwright/test';
import { apiHelper } from '../../utils/apiHelper';
import { disposeApiContext, getApiContext } from '../../utils/apiContext';
import { User } from '../../data/user';
import { LoginPage } from '../../pages/loginPage';
import { SignupPage } from '../../pages/signupPage';
import { ProductsPage } from '../../pages/productsPage';
import { CartPage } from '../../pages/cartPage';
import { CheckoutPage } from '../../pages/checkoutPage';
import { PaymentPage } from '../../pages/paymentPage';
import { TEST_CARD } from '../../data/payment';

test('E2E-14: Place Order: Register while Checkout @critical' , async ({ page, request }, testInfo) => {
    test.setTimeout(75_000);
    const signUpPage = new SignupPage(page);
    const loginPage = new LoginPage(page);
    const productPage = new ProductsPage(page);
    const cartPage = new CartPage(page);

    const products = ["1", "2", "3"];
    let user: User | undefined;

    try {
        user = User.generateRandom();
        testInfo.annotations.push({
            type: 'Test Data',
            description: `Name: ${user.name} | Email: ${user.email} | Password: ${user.password}`
        });

        await test.step(`Add products to cart and proceed to checkout`, async () => {
            await page.goto('/products');
            await productPage.handleCommonAds(); // Handle any ads that may appear on the products page
            await productPage.addMultipleProducts(products);
            await productPage.goToCart();
            await cartPage.proceedToCheckout();
            await cartPage.loginFromModal();
        });
        await test.step(`Sign up new user`, async () => {
            await loginPage.signUp(user);
            await signUpPage.fillForm(user);
            await signUpPage.verifyAccountCreation();
        });
        await test.step(`Verify products are still in cart after registration`, async () => {
            await cartPage.goToCart();
            await cartPage.verifyProductInCart(products);
        });
    } finally {
        const apiRequest = await getApiContext();
        await apiHelper.deleteUserIfExists(apiRequest, user);
        await disposeApiContext();
    }
})

test.describe('Place Order tests', () => {
    test('E2E-15: Place Order: Login while Checkout @critical', async ({ page, request }, testInfo) => {
        const productPage = new ProductsPage(page);
        const cartPage = new CartPage(page);
        const loginPage = new LoginPage(page);

        const products = ["1", "3", "5"];
        let user: User | undefined;

        try {
            user = await apiHelper.createManagedUser(request, testInfo);

            await test.step(`Add products to cart and proceed to checkout`, async () => {
                await page.goto('/products');
                await productPage.addMultipleProducts(products);
                await productPage.goToCart();
                await cartPage.proceedToCheckout();
                await cartPage.loginFromModal();
            });
            await test.step(`Login with existing user`, async () => {
                await loginPage.login(user);
                await loginPage.verifyLoginSuccess(user);
            });
            await test.step(`Verify products are still in cart after login`, async () => {
                await loginPage.goToCart();
                await cartPage.verifyProductInCart(products);
            });
        } finally {
            const apiRequest = await getApiContext();
            await apiHelper.deleteUserIfExists(apiRequest, user);
            await disposeApiContext();
        }
});

test('E2E-16: Place Order: Login and Payment @critical' , async ({ page, request }, testInfo) => {
    test.setTimeout(45_000);
    const loginPage = new LoginPage(page);
    const productPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const paymentPage = new PaymentPage(page);

    const products = ["2", "4", "6"];
    let user: User | undefined;

    try {
        user = await apiHelper.createManagedUser(request, testInfo);

        await test.step(`Login with existing user`, async () => {
            await loginPage.goto();
            await loginPage.login(user);
            await loginPage.verifyLoginSuccess(user);
        });
        await test.step(`Add products to cart, proceed to checkout and place order`, async () => {
            await loginPage.goToProducts();
            await productPage.addMultipleProducts(products);
            await productPage.goToCart();
            await cartPage.verifyProductInCart(products);
            await cartPage.proceedToCheckout();
            await checkoutPage.verifyProductInCheckout(products);
        });
        await test.step(`Fill payment details and confirm order`, async () => {
            await checkoutPage.placeOrder();
            await paymentPage.fillPaymentDetails(TEST_CARD);
            await paymentPage.clickPayAndConfirm();
            await paymentPage.verifyPaymentSuccess();
        });
    } finally {
        const apiRequest = await getApiContext();
        await apiHelper.deleteUserIfExists(apiRequest, user);
        await disposeApiContext();
    }
})

test('E2E-23: Verify address details in Checkout page @high', async ({ page, request }, testInfo) => {
    test.setTimeout(45_000);
    const loginPage = new LoginPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const productId = '1';
    let user: User | undefined;

    try {
        user = await apiHelper.createManagedUser(request, testInfo);

        await test.step(`Login with existing user`, async () => {
            await loginPage.goto();
            await loginPage.login(user);
            await loginPage.verifyLoginSuccess(user);
        });

        await test.step(`Add product to cart via API and proceed to checkout`, async () => {
            const cookieHeader = await loginPage.getCookieHeader();
            await apiHelper.addProductToCart(request, productId, cookieHeader);

            await page.goto('/view_cart');
            await cartPage.handleCommonAds();
            await cartPage.verifyCartIsOpen();
            await cartPage.proceedToCheckout();
            await checkoutPage.verifyProductInCheckout([productId]);
        });

        await test.step(`Verify delivery and billing addresses`, async () => {
            await checkoutPage.verifyAddressDetails(user);
        });
    } finally {
        const apiRequest = await getApiContext();
        await apiHelper.deleteUserIfExists(apiRequest, user);
        await disposeApiContext();
    }
})
}); 

test('BUG-4: Payment field is blocked by overlay on large screens', async ({ page }) => {
    const paymentPage = new PaymentPage(page);

    await page.setViewportSize({ width: 980, height: 900 });
    await page.goto('/payment');
    await paymentPage.handleCommonAds();
    await expect(async () => {
        await paymentPage.nameOnCardInput.click({ timeout: 3000 });
    }).rejects.toThrow(/intercepts pointer events/);
});
