import { test } from '../../utils/fixtures';
import { ProductsPage } from '../../pages/products.page';
import { ProductDetailsPage } from '../../pages/product-details.page';

const productNumber = 1;
const reviewAuthor = {
  name: 'QA Reviewer',
  email: 'qa.reviewer@example.com',
  text: 'Great product. Review submitted successfully.',
};

test('E2E-21: Add review on product @medium', async ({ page }) => {
  const productsPage = new ProductsPage(page);
  const productDetailsPage = new ProductDetailsPage(page);

  await page.goto('/');

  await test.step('Navigate to all products page', async () => {
    await productsPage.goToProducts();
    await productsPage.verifyProductsPageOpen();
  });

  await test.step('Open product details page', async () => {
    await productsPage.openProductDetails(productNumber);
    await productDetailsPage.verifyProductDetailsPageOpen();
  });

  await test.step('Submit product review', async () => {
    await productDetailsPage.verifyWriteYourReviewVisible();
    await productDetailsPage.submitReview(reviewAuthor.name, reviewAuthor.email, reviewAuthor.text);
    await productDetailsPage.verifyReviewSubmitted();
  });
});
