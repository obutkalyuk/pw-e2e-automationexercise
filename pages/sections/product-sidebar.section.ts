import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';

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

  private getBrandUrlPattern(brandName: string) {
    return new RegExp(`/brand_products/${encodeURIComponent(brandName)}$`);
  }

  private isOnCategoryUrl(categoryId: string) {
    return this.getCategoryUrlPattern(categoryId).test(this.page.url());
  }

  private isOnBrandUrl(brandName: string) {
    return this.getBrandUrlPattern(brandName).test(this.page.url());
  }

  private async waitForUrlOrVignette(targetUrlPattern: RegExp, timeout = 15_000) {
    try {
      await this.page.waitForURL(
        (url) => targetUrlPattern.test(url.toString()) || /#google_vignette$/.test(url.toString()),
        { timeout },
      );
    } catch {
      await expect(this.page).toHaveURL(targetUrlPattern);
    }
  }

  private async clickLinkAndWaitForNavigation(link: Locator, targetUrlPattern: RegExp) {
    await this.scrollCategoryLinkIntoView(link);
    await link.click();
    await this.waitForUrlOrVignette(targetUrlPattern);
  }

  private async clickSubcategoryLinkAndWaitForNavigation(
    subcategoryLink: Locator,
    categoryId: string,
  ) {
    await this.clickLinkAndWaitForNavigation(
      subcategoryLink,
      this.getCategoryUrlPattern(categoryId),
    );
  }

  private async clickBrandLinkAndWaitForNavigation(brandLink: Locator, brandName: string) {
    await this.clickLinkAndWaitForNavigation(brandLink, this.getBrandUrlPattern(brandName));
  }

  private async recoverNavigationFromVignette(
    link: Locator,
    targetUrlPattern: RegExp,
    isOnTargetUrl: () => boolean,
  ) {
    if (!this.isOnGoogleVignette()) {
      return;
    }

    await this.page
      .waitForURL(
        (url) => targetUrlPattern.test(url.toString()) || !/#google_vignette$/.test(url.toString()),
        { timeout: 5_000 },
      )
      .catch(() => {});

    if (!isOnTargetUrl()) {
      await Promise.all([
        this.page.waitForURL(targetUrlPattern),
        (async () => {
          await this.scrollCategoryLinkIntoView(link);
          await link.click();
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

  async openBrand(brandName: string) {
    const brandLink = this.leftSidebar
      .locator('.brands_products')
      .getByRole('link', { name: new RegExp(brandName, 'i') });

    await this.clickBrandLinkAndWaitForNavigation(brandLink, brandName);
    await this.recoverNavigationFromVignette(brandLink, this.getBrandUrlPattern(brandName), () =>
      this.isOnBrandUrl(brandName),
    );
  }

  async expandCategory(categoryName: 'Women' | 'Men' | 'Kids') {
    const categoryToggle = this.categoryAccordion.locator(`a[href="#${categoryName}"]`);
    const categoryToggleText = categoryToggle.getByText(categoryName, { exact: true });
    const categoryPanel = this.page.locator(`#${categoryName}`);
    const firstSubcategoryLink = categoryPanel.locator('ul li a').first();

    await categoryToggle.scrollIntoViewIfNeeded();
    await categoryToggleText.click();

    await expect(firstSubcategoryLink).toBeVisible();
  }

  async openSubcategory(
    categoryName: 'Women' | 'Men' | 'Kids',
    subcategoryName: string,
    categoryId: string,
  ) {
    const categoryPanel = this.page.locator(`#${categoryName}`);

    if (!(await categoryPanel.getAttribute('class'))?.includes('in')) {
      await this.expandCategory(categoryName);
    }

    const subcategoryLink = categoryPanel.getByRole('link', { name: subcategoryName, exact: true });
    await this.clickSubcategoryLinkAndWaitForNavigation(subcategoryLink, categoryId);
    await this.recoverNavigationFromVignette(
      subcategoryLink,
      this.getCategoryUrlPattern(categoryId),
      () => this.isOnCategoryUrl(categoryId),
    );
  }

  async verifyCategoryResult(categoryName: string, subcategoryName: string, categoryId: string) {
    await expect(this.page).toHaveURL(this.getCategoryUrlPattern(categoryId));
    await expect(this.breadcrumb).toContainText(`${categoryName} > ${subcategoryName}`);
    await expect(this.categoryResultTitle).toHaveText(
      `${categoryName} - ${subcategoryName} Products`,
    );
  }

  async verifyBrandResult(brandName: string) {
    await expect(this.page).toHaveURL(this.getBrandUrlPattern(brandName));
    await expect(this.breadcrumb).toContainText(brandName);
    await expect(this.categoryResultTitle).toContainText(brandName);
  }
}
