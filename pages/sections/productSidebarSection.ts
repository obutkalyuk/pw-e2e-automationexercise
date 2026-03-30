import { expect, Locator, Page } from '@playwright/test';

export class ProductSidebarSection {
  readonly page: Page;
  readonly leftSidebar: Locator;
  readonly categoryTitle: Locator;
  readonly categoryAccordion: Locator;
  readonly brandsTitle: Locator;
  readonly breadcrumb: Locator;
  readonly categoryResultTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.leftSidebar = page.locator('.left-sidebar');
    this.categoryTitle = this.leftSidebar.getByRole('heading', { name: 'Category' });
    this.categoryAccordion = this.leftSidebar.locator('#accordian');
    this.brandsTitle = this.leftSidebar.getByRole('heading', { name: 'Brands' });
    this.breadcrumb = page.locator('.breadcrumb');
    this.categoryResultTitle = page.locator('.features_items .title.text-center').first();
  }

  async verifyCategoriesVisible() {
    await expect(this.categoryTitle).toBeVisible();
    await expect(this.categoryAccordion).toBeVisible();
    await expect(this.categoryAccordion.locator('a[href="#Women"]')).toBeVisible();
    await expect(this.categoryAccordion.locator('a[href="#Men"]')).toBeVisible();
    await expect(this.categoryAccordion.locator('a[href="#Kids"]')).toBeVisible();
  }

  async verifyBrandsVisible() {
    await expect(this.brandsTitle).toBeVisible();
    await expect(this.leftSidebar.locator('.brands_products a').first()).toBeVisible();
  }

  async expandCategory(categoryName: 'Women' | 'Men' | 'Kids', handleCommonAds?: () => Promise<void>) {
    const categoryToggle = this.categoryAccordion.locator(`a[href="#${categoryName}"]`);
    const categoryToggleText = categoryToggle.getByText(categoryName, { exact: true });
    const categoryPanel = this.page.locator(`#${categoryName}`);
    const firstSubcategoryLink = categoryPanel.locator('ul li a').first();

    await categoryToggle.scrollIntoViewIfNeeded();
    await categoryToggleText.click();

    if (handleCommonAds) {
      await handleCommonAds();
    }

    await expect(firstSubcategoryLink).toBeVisible();
  }

  async openSubcategory(
    categoryName: 'Women' | 'Men' | 'Kids',
    subcategoryName: string,
    categoryId: string,
    handleCommonAds?: () => Promise<void>
  ) {
    const categoryPanel = this.page.locator(`#${categoryName}`);

    if (!(await categoryPanel.getAttribute('class'))?.includes('in')) {
      await this.expandCategory(categoryName, handleCommonAds);
    }

    const subcategoryLink = categoryPanel.getByRole('link', { name: subcategoryName, exact: true });

    await subcategoryLink.evaluate((element: HTMLElement) => {
      element.scrollIntoView({ block: 'center', inline: 'nearest' });
    });
    await Promise.all([
      this.page.waitForURL(new RegExp(`/category_products/${categoryId}$`)),
      subcategoryLink.click(),
    ]);

    if (handleCommonAds) {
      await handleCommonAds();
    }
  }

  async verifyCategoryResult(categoryName: string, subcategoryName: string, categoryId: string) {
    await expect(this.page).toHaveURL(new RegExp(`/category_products/${categoryId}$`));
    await expect(this.breadcrumb).toContainText(`${categoryName} > ${subcategoryName}`);
    await expect(this.categoryResultTitle).toHaveText(`${categoryName} - ${subcategoryName} Products`);
  }
}
