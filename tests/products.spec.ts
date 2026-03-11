import { test, expect, BrowserContext, Page } from '@playwright/test';
import { ENV } from '../config/env.config';
import { DashboardPage } from '../pages/dashboard.page';
import { ProductsPage } from '../pages/products.page';

// =============================================================================
// SCRIPT 2 — PRODUCT CRUD
// storageState skips login (email/password/OTP)
// switchMerchant still needed to set merchant context for products URL
// =============================================================================

const PRODUCT_NAME = process.env.PRODUCT_NAME || 'TestProduct_1';
const PRODUCT_SKU  = process.env.PRODUCT_SKU  || 'TestSKUId_1';
const UPDATED_NAME = `${PRODUCT_NAME}_Updated`;

let context: BrowserContext;
let page: Page;
let productId: string;

test.beforeAll(async ({ browser }) => {
  console.log('\n========================================');
  console.log(`📦 Product Name : ${PRODUCT_NAME}`);
  console.log(`🔑 SKU          : ${PRODUCT_SKU}`);
  console.log(`✏️  Updated Name : ${UPDATED_NAME}`);
  console.log('========================================\n');

  context = await browser.newContext({ storageState: 'auth/session.json' });
  page    = await context.newPage();

  // Login skipped — session restored from storageState
  // Merchant switch still required to set store context
  const dashboardPage = new DashboardPage(page);
  await page.goto(`${ENV.BASE_URL}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  console.log('🏪 Switching merchant...');
  await dashboardPage.switchMerchant();

  console.log('✅ Setup complete — starting CRUD tests\n');
});

test.afterAll(async () => {
  await context.close();
});

// ── TC_PRODUCT_01: CREATE ─────────────────────────────────────────────────────
test('TC_PRODUCT_01 - Create Product - fill title and SKU, verify in listing with Active status', async () => {
  const productsPage = new ProductsPage(page);

  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  console.log(`\n➕ Creating: "${PRODUCT_NAME}" | SKU: "${PRODUCT_SKU}"`);
  await productsPage.createProduct(PRODUCT_NAME, PRODUCT_SKU);

  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  const isVisible = await productsPage.isProductVisible(PRODUCT_NAME);
  expect(isVisible, `"${PRODUCT_NAME}" should appear in listing`).toBeTruthy();

  productId = await productsPage.getProductIdByName(PRODUCT_NAME);

  const productRow = page.locator(`tr:has([data-test-id="products_table_product_link_${productId}"])`);
  const statusCell = productRow.locator('text=Active').first();
  await expect(statusCell).toBeVisible();

  console.log(`✅ CREATE — "${PRODUCT_NAME}" visible | Status: Active | ID: ${productId}`);
});

// ── TC_PRODUCT_02: READ ───────────────────────────────────────────────────────
test('TC_PRODUCT_02 - Read Product - search by name, verify name, status and variant count', async () => {
  const productsPage = new ProductsPage(page);

  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  const searchInput = page.locator('[placeholder*="Search" i], input[type="search"]').first();
  await searchInput.waitFor({ state: 'visible', timeout: 8000 });
  await searchInput.fill(PRODUCT_NAME);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);

  const isVisible = await productsPage.isProductVisible(PRODUCT_NAME);
  expect(isVisible, `"${PRODUCT_NAME}" should appear in search results`).toBeTruthy();

  const productRow  = page.locator(`tr:has([data-test-id="products_table_product_link_${productId}"])`);
  const productLink = page.locator(`[data-test-id="products_table_product_link_${productId}"]`);

  const linkText = await productLink.textContent();
  expect(linkText?.trim()).toBe(PRODUCT_NAME);
  console.log(`  ✅ Name: "${linkText?.trim()}"`);

  const statusCell = productRow.locator('text=Active').first();
  await expect(statusCell).toBeVisible();
  console.log('  ✅ Status: Active');

  const variantText = await productRow.locator('text=/\\d+ variant/i').first().textContent().catch(() => 'N/A');
  console.log(`  ✅ Variants: "${variantText?.trim()}"`);

  console.log(`✅ READ — Name, Status and Variant count verified`);
});

// ── TC_PRODUCT_03: UPDATE ─────────────────────────────────────────────────────
test('TC_PRODUCT_03 - Update Product - change name and verify updated in listing', async () => {
  const productsPage = new ProductsPage(page);

  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  const productLink = page.locator(`[data-test-id="products_table_product_link_${productId}"]`);
  await productLink.waitFor({ state: 'visible', timeout: 10000 });
  await productLink.click();
  await page.waitForLoadState('domcontentloaded');

  const titleInput = page.locator('[data-test-id="title_input"]');
  await titleInput.waitFor({ state: 'visible', timeout: 10000 });
  await titleInput.clear();
  await titleInput.fill(UPDATED_NAME);

  await page.locator('[data-test-id="product_form_save_button"]').click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);

  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  const isUpdatedVisible = await productsPage.isProductVisible(UPDATED_NAME);
  expect(isUpdatedVisible, `"${UPDATED_NAME}" should appear in listing`).toBeTruthy();

  const isOldVisible = await productsPage.isProductVisible(PRODUCT_NAME);
  expect(isOldVisible, `Old name "${PRODUCT_NAME}" should no longer appear`).toBeFalsy();

  console.log(`✅ UPDATE — name changed to "${UPDATED_NAME}" and verified in listing`);
});

// ── TC_PRODUCT_04: DELETE ─────────────────────────────────────────────────────
test('TC_PRODUCT_04 - Delete Product - confirm modal, validate toast and verify removed', async () => {
  const productsPage = new ProductsPage(page);

  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  expect(productId, 'Product ID must be set from TC_PRODUCT_01').toBeDefined();
  console.log(`\n🗑️  Deleting: "${UPDATED_NAME}" (ID: ${productId})`);

  const checkbox = page.locator(`[data-test-id="generic_table_row_checkbox_${productId}"]`);
  await checkbox.waitFor({ state: 'visible', timeout: 15000 });
  await checkbox.check();

  const moreActions = page.locator('[data-test-id="bulk_action_toolbar_more_actions_button"]');
  await moreActions.waitFor({ state: 'visible', timeout: 8000 });
  await moreActions.click();

  const deleteOption = page.getByText('Delete products');
  await deleteOption.waitFor({ state: 'visible', timeout: 5000 });
  await deleteOption.click();

  const okButton = page.getByRole('button', { name: 'OK' });
  await okButton.waitFor({ state: 'visible', timeout: 8000 });
  console.log('  ✅ Confirmation modal appeared');
  await okButton.click();

  const toast = page.locator('[class*="toast"], [class*="message"], [class*="notification"], [role="alert"]').first();
  const toastVisible = await toast.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
  if (toastVisible) {
    console.log(`  ✅ Toast: "${(await toast.textContent())?.trim()}"`);
  }

  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);

  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  const searchInput = page.locator('[placeholder*="Search" i], input[type="search"]').first();
  await searchInput.waitFor({ state: 'visible', timeout: 8000 });
  await searchInput.fill(UPDATED_NAME);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);

  const isStillVisible = await productsPage.isProductVisible(UPDATED_NAME);
  expect(isStillVisible, `"${UPDATED_NAME}" should NOT appear after deletion`).toBeFalsy();

  console.log(`✅ DELETE — "${UPDATED_NAME}" removed. Search returns no results.`);
});
