import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../basePage';

export class ProductSidebarSection extends BasePage {
  readonly leftSidebar: Locator;
  readonly categoryTitle: Locator;
  readonly categoryAccordion: Locator;
  readonly brandsTitle: Locator;
  readonly breadcrumb: Locator;
  readonly categoryResultTitle: Locator;

  constructor(page: Page) {
    super(page);
    this.leftSidebar = page.locator('.left-sidebar');
    this.categoryTitle = this.leftSidebar.getByRole('heading', { name: 'Category' });
    this.categoryAccordion = this.leftSidebar.locator('#accordian');
    this.brandsTitle = this.leftSidebar.getByRole('heading', { name: 'Brands' });
    this.breadcrumb = page.locator('.breadcrumb');
    this.categoryResultTitle = page.locator('.features_items .title.text-center').first();
  }

  private async scrollCategoryLinkIntoView(locator: Locator) {
    await locator.evaluate((element: HTMLElement) => {
      element.scrollIntoView({ block: 'center', inline: 'nearest' });
    });
  }

  private getCategoryUrlPattern(categoryId: string) {
    return new RegExp(`/category_products/${categoryId}$`);
  }

  private isOnCategoryUrl(categoryId: string) {
    return this.getCategoryUrlPattern(categoryId).test(this.page.url());
  }

  private async waitForCategoryUrlOrVignette(categoryId: string, timeout = 15_000) {
    const targetCategoryPattern = this.getCategoryUrlPattern(categoryId);

    try {
      await this.page.waitForURL(
        url => targetCategoryPattern.test(url.toString()) || /#google_vignette$/.test(url.toString()),
        { timeout }
      );
    } catch {
      await expect(this.page).toHaveURL(targetCategoryPattern);
    }
  }

  private async clickSubcategoryLinkAndWaitForNavigation(subcategoryLink: Locator, categoryId: string) {
    await this.scrollCategoryLinkIntoView(subcategoryLink);
    await subcategoryLink.click();
    await this.waitForCategoryUrlOrVignette(categoryId);
  }

  private async recoverFromVignette(
    subcategoryLink: Locator,
    categoryId: string,
    adHandler?: () => Promise<void>
  ) {
    if (!this.isOnGoogleVignette()) {
      return;
    }

    await this.handleAdsIfNeeded(adHandler);

    await this.page.waitForURL(
      url => this.getCategoryUrlPattern(categoryId).test(url.toString()) || !/#google_vignette$/.test(url.toString()),
      { timeout: 5_000 }
    ).catch(() => {});

    if (!this.isOnCategoryUrl(categoryId)) {
      await Promise.all([
        this.page.waitForURL(this.getCategoryUrlPattern(categoryId)),
        (async () => {
          await this.scrollCategoryLinkIntoView(subcategoryLink);
          await subcategoryLink.click();
        })(),
      ]);
    }
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

  async expandCategory(categoryName: 'Women' | 'Men' | 'Kids', adHandler?: () => Promise<void>) {
    const categoryToggle = this.categoryAccordion.locator(`a[href="#${categoryName}"]`);
    const categoryToggleText = categoryToggle.getByText(categoryName, { exact: true });
    const categoryPanel = this.page.locator(`#${categoryName}`);
    const firstSubcategoryLink = categoryPanel.locator('ul li a').first();

    await categoryToggle.scrollIntoViewIfNeeded();
    await categoryToggleText.click();
    await this.handleAdsIfNeeded(adHandler);

    await expect(firstSubcategoryLink).toBeVisible();
  }

  async openSubcategory(
    categoryName: 'Women' | 'Men' | 'Kids',
    subcategoryName: string,
    categoryId: string,
    adHandler?: () => Promise<void>
  ) {
    const categoryPanel = this.page.locator(`#${categoryName}`);

    if (!(await categoryPanel.getAttribute('class'))?.includes('in')) {
      await this.expandCategory(categoryName, adHandler);
    }

    const subcategoryLink = categoryPanel.getByRole('link', { name: subcategoryName, exact: true });
    await this.clickSubcategoryLinkAndWaitForNavigation(subcategoryLink, categoryId);
    await this.handleAdsIfNeeded(adHandler);
    await this.recoverFromVignette(subcategoryLink, categoryId, adHandler);
  }

  async verifyCategoryResult(categoryName: string, subcategoryName: string, categoryId: string) {
    await expect(this.page).toHaveURL(this.getCategoryUrlPattern(categoryId));
    await expect(this.breadcrumb).toContainText(`${categoryName} > ${subcategoryName}`);
    await expect(this.categoryResultTitle).toHaveText(`${categoryName} - ${subcategoryName} Products`);
  }
}
