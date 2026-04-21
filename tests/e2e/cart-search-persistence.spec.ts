import { test } from '../../utils/fixtures';
import { ProductsPage } from '../../pages/products.page';
import { CartPage } from '../../pages/cart.page';
import { LoginPage } from '../../pages/login.page';
import { apiHelper } from '../../utils/api-helper';
import { disposeApiContext, getApiContext } from '../../utils/api-context';
import { User } from '../../data/user.data';

test('E2E-20: Search Products and Verify Cart After Login @high', async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(45_000);
  const productsPage = new ProductsPage(page);
  const cartPage = new CartPage(page);
  const loginPage = new LoginPage(page);
  const searchTerm = 'jeans';
  let user: User | undefined;

  try {
    user = await apiHelper.createManagedUser(request, testInfo);
    testInfo.annotations.push({
      type: 'Test Data',
      description: `Search term: ${searchTerm}`,
    });

    await page.goto('/products');
    await productsPage.handleCommonAds();

    await test.step('Open products page and search for products', async () => {
      await productsPage.verifyProductsPageOpen();
      await productsPage.verifyProductsListVisible();
      await productsPage.searchProduct(searchTerm);
      await productsPage.verifySearchResults(searchTerm);
    });

    let productIds: string[] = [];
    await test.step('Add searched products to cart and verify cart', async () => {
      productIds = await productsPage.getVisibleProductIds();
      await productsPage.addMultipleProducts(productIds);
      await productsPage.goToCart();
      await cartPage.verifyCartIsOpen();
      await cartPage.verifyProductInCart(productIds);
    });

    await test.step('Login and verify cart still contains searched products', async () => {
      await cartPage.goToLogin();
      await loginPage.login(user);
      await loginPage.verifyLoginSuccess(user);
      await loginPage.goToCart();
      await cartPage.verifyCartIsOpen();
      await cartPage.verifyProductInCart(productIds);
    });
  } finally {
    const apiRequest = await getApiContext();
    await apiHelper.deleteUserIfExists(apiRequest, user);
    await disposeApiContext();
  }
});
