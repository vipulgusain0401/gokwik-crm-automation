import { Page, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { WaitHelper } from '../utils/wait-helper';

export class ProductsPage extends BasePage {
  // ── Listing page ─────────────────────────────────────────────────────────────
  private readonly addProductButton = this.page.locator('[data-test-id="products_add_button"]');
  private readonly filterButton = this.page.locator('[data-test-id="products_filter_button"]');
  private readonly filterAll = this.page.locator('[data-test-id="products_filter_all"]');
  private readonly tableRows = this.page.locator('.ant-table-tbody .ant-table-row');

  // ── Create / Edit form ────────────────────────────────────────────────────────
  private readonly titleInput = this.page.locator('[data-test-id="title_input"]');

  // FIX: Two .ql-editor elements exist — use the first one (main description box)
  private readonly descriptionEditor = this.page.locator('.ql-editor').first();

  private readonly skuInput = this.page.locator('[data-test-id="inventory_card_sku_input"]');
  private readonly shippingHeader = this.page.locator('[data-test-id="shipping_card_header"]');
  private readonly physicalProductCheckbox = this.page.locator('[data-test-id="shipping_card_physical_product_checkbox"]');
  private readonly createSubmitButton = this.page.locator('[data-test-id="create_product_submit_button"]');
  private readonly saveButton = this.page.locator('[data-test-id="product_form_save_button"]');

  // ── Validation errors ─────────────────────────────────────────────────────────
  private readonly skuRequiredError = this.page.getByText('SKU is required');

  // ── Bulk actions / Delete ─────────────────────────────────────────────────────
  private readonly moreActionsButton = this.page.locator('[data-test-id="bulk_action_toolbar_more_actions_button"]');
  private readonly deleteProductsOption = this.page.getByText('Delete products');
  private readonly confirmOkButton = this.page.getByRole('button', { name: 'OK' });

  constructor(page: Page) {
    super(page, 'ProductsPage');
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────────
  getProductLink(productId: string) {
    return this.page.locator(`[data-test-id="products_table_product_link_${productId}"]`);
  }

  getRowCheckbox(productId: string) {
    return this.page.locator(`[data-test-id="generic_table_row_checkbox_${productId}"]`);
  }

  getBulkEditButton() {
    return this.page.locator('[data-test-id="header_action_button_bulkEdit"]');
  }

  getBulkEditCell(productId: string, field: string) {
    return this.page.locator(`[data-test-id="bulk_product_edit_cell_${productId}_${field}"]`);
  }

  getBulkEditInput(productId: string, field: string) {
    return this.page.locator(`[data-test-id="bulk_product_edit_input_${productId}_${field}"]`);
  }

  // ── WAIT FOR LIST ─────────────────────────────────────────────────────────────
  async waitForProductsToLoad(): Promise<void> {
    this.logger.step('Waiting for products list to load');
    await this.addProductButton.waitFor({ state: 'visible', timeout: 15000 });
    await WaitHelper.waitForNetworkIdle(this.page);
  }

  // ── CREATE ────────────────────────────────────────────────────────────────────
  async createProduct(productName: string, sku: string, description = 'Automated test product'): Promise<void> {
    this.logger.step(`Creating product: ${productName} | SKU: ${sku}`);

    await this.addProductButton.click();

    // Fill title
    await this.titleInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.titleInput.fill(productName);

    // Fill description — use .first() to avoid strict mode error with 2 ql-editor elements
    await this.descriptionEditor.waitFor({ state: 'visible', timeout: 5000 });
    await this.descriptionEditor.fill(description);

    // Uncheck physical product to avoid extra required shipping fields
    await this.shippingHeader.click();
    await this.physicalProductCheckbox.uncheck();

    // First submit attempt
    await this.createSubmitButton.click();
    await this.page.waitForTimeout(1000);

    // Handle SKU required validation — fill and resubmit
    const skuErrorVisible = await this.skuRequiredError.isVisible().catch(() => false);
    if (skuErrorVisible) {
      this.logger.info('SKU required error appeared — filling SKU');
      await this.skuInput.fill(sku);
      await this.createSubmitButton.click();
    }

    await WaitHelper.waitForNetworkIdle(this.page);
    this.logger.info(`Product "${productName}" created successfully`);
  }

  // ── READ: resolve product ID from listing by name ─────────────────────────────
  async getProductIdByName(productName: string): Promise<string> {
    this.logger.step(`Fetching product ID for: ${productName}`);
    const link = this.page.locator(`[data-test-id^="products_table_product_link_"]:has-text("${productName}")`).first();
    await link.waitFor({ state: 'visible', timeout: 10000 });
    const testId = await link.getAttribute('data-test-id') ?? '';
    const productId = testId.replace('products_table_product_link_', '');
    this.logger.info(`Product ID resolved: ${productId}`);
    return productId;
  }

  async isProductVisible(productName: string): Promise<boolean> {
    try {
      const link = this.page.locator(`[data-test-id^="products_table_product_link_"]:has-text("${productName}")`).first();
      await link.waitFor({ state: 'visible', timeout: 8000 });
      return true;
    } catch {
      return false;
    }
  }

  // ── UPDATE: open product form → change SKU → save ─────────────────────────────
  async openProductForEdit(productId: string): Promise<void> {
    this.logger.step(`Opening product for edit: ${productId}`);
    await this.getProductLink(productId).click();
    await this.waitForPageReady();
  }

  async updateSkuAndSave(newSku: string): Promise<void> {
    this.logger.step(`Updating SKU to: ${newSku}`);
    await this.skuInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.skuInput.clear();
    await this.skuInput.fill(newSku);
    await this.saveButton.click();
    await this.page.waitForTimeout(1000);

    // If SKU error still shows, retry
    const skuErrorVisible = await this.skuRequiredError.isVisible().catch(() => false);
    if (skuErrorVisible) {
      this.logger.warn('SKU error after update — retrying');
      await this.skuInput.fill(newSku);
      await this.saveButton.click();
    }

    await WaitHelper.waitForNetworkIdle(this.page);
    this.logger.info('Product saved');
  }

  // ── DELETE: checkbox → More Actions → Delete → OK ─────────────────────────────
  async deleteProduct(productId: string): Promise<void> {
    this.logger.step(`Deleting product: ${productId}`);
    await this.getRowCheckbox(productId).check();
    await this.moreActionsButton.click();
    await this.deleteProductsOption.click();
    await this.confirmOkButton.waitFor({ state: 'visible', timeout: 8000 });
    await this.confirmOkButton.click();
    await WaitHelper.waitForNetworkIdle(this.page);
    this.logger.info(`Product ${productId} deleted`);
  }

  // ── FILTER ────────────────────────────────────────────────────────────────────
  async filterAllProducts(): Promise<void> {
    this.logger.step('Applying "All" filter');
    await this.filterButton.click();
    await this.filterAll.click();
    await WaitHelper.waitForNetworkIdle(this.page);
  }

  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  // ── PAGINATION ────────────────────────────────────────────────────────────────
  async isNextPageEnabled(): Promise<boolean> {
    try {
      const nextBtn = this.page.locator('.ant-pagination-next button');
      await nextBtn.waitFor({ state: 'visible', timeout: 3000 });
      return !(await nextBtn.isDisabled());
    } catch {
      return false;
    }
  }

  async goToNextPage(): Promise<void> {
    this.logger.step('Going to next page');
    const nextBtn = this.page.locator('.ant-pagination-next button');
    await nextBtn.click();
    await WaitHelper.waitForNetworkIdle(this.page);
  }

  // ── PRODUCT DETAIL VALIDATIONS ────────────────────────────────────────────────
  async verifyProductDetailPage(productName: string, sku: string): Promise<void> {
    this.logger.step('Verifying product detail page fields');

    // Title should be visible and match
    await this.titleInput.waitFor({ state: 'visible', timeout: 10000 });
    const titleValue = await this.titleInput.inputValue();
    expect(titleValue).toBe(productName);
    this.logger.info(`Title verified: "${titleValue}"`);

    // SKU should match
    const skuValue = await this.skuInput.inputValue();
    expect(skuValue).toBe(sku);
    this.logger.info(`SKU verified: "${skuValue}"`);
  }
}
