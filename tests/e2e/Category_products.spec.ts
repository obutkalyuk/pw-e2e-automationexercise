import { test } from '../../utils/fixtures';
import { HomePage } from '../../pages/homePage';
import { apiHelper } from '../../utils/apiHelper';

const firstCategory = {
  group: 'Women' as const,
  subcategory: 'Saree',
  id: '7',
};

const secondCategory = {
  group: 'Men' as const,
  subcategory: 'Jeans',
  id: '6',
};

test('E2E-18: View Category Products @medium', async ({ page, request }) => {
  const homePage = new HomePage(page);
  const products = await apiHelper.getProductsList(request);

  await page.goto('/');
  await homePage.handleCommonAds();

  await test.step('Verify categories are visible on left sidebar', async () => {
    await homePage.productSidebar.verifyCategoriesVisible();
  });

  await test.step(`Open ${firstCategory.group} > ${firstCategory.subcategory} category page`, async () => {
    await homePage.productSidebar.expandCategory(firstCategory.group, () =>
      homePage.handleCommonAds(),
    );
    await homePage.productSidebar.openSubcategory(
      firstCategory.group,
      firstCategory.subcategory,
      firstCategory.id,
      () => homePage.handleCommonAds(),
    );
    await homePage.productSidebar.verifyCategoryResult(
      firstCategory.group,
      firstCategory.subcategory,
      firstCategory.id,
    );
    await homePage.productCatalog.verifyProductsListVisible();
    await homePage.productCatalog.verifyVisibleProductsMatchCategory(
      products,
      firstCategory.group,
      firstCategory.subcategory,
    );
  });

  await test.step(`Open ${secondCategory.group} > ${secondCategory.subcategory} category page`, async () => {
    await homePage.productSidebar.expandCategory(secondCategory.group, () =>
      homePage.handleCommonAds(),
    );
    await homePage.productSidebar.openSubcategory(
      secondCategory.group,
      secondCategory.subcategory,
      secondCategory.id,
      () => homePage.handleCommonAds(),
    );
    await homePage.productSidebar.verifyCategoryResult(
      secondCategory.group,
      secondCategory.subcategory,
      secondCategory.id,
    );
    await homePage.productCatalog.verifyProductsListVisible();
    await homePage.productCatalog.verifyVisibleProductsMatchCategory(
      products,
      secondCategory.group,
      secondCategory.subcategory,
    );
  });
});
