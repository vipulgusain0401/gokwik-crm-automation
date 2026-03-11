import { test, expect, BrowserContext, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { ProductsPage } from '../pages/products.page';
import { ENV } from '../config/env.config';
import * as readline from 'readline';

// =============================================================================
// SCRIPT 2 — PRODUCT CRUD (Single script, single login, shared session)
// Sequence:
//   Login → Switch Merchant → Navigate to Products
//   → Create → Read/Verify in list → Update (SKU validation + successful update)
//   → Delete → Verify removed
// =============================================================================

// ── Prompt for product name and SKU from terminal ────────────────────────────
async function promptInput(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim() || '');
    });
  });
}

let context: BrowserContext;
let page: Page;
let productId: string;
let PRODUCT_NAME: string;
let PRODUCT_SKU: string;
let UPDATED_SKU: string;

test.beforeAll(async ({ browser }) => {
  // ── Prompt for test data from terminal ──────────────────────────────────────
  const inputName = await promptInput('\n📦 Enter Product Name (or press Enter to use "TestProduct_1"): ');
  const inputSku  = await promptInput('🔑 Enter SKU ID (or press Enter to use "TestSKUId_1"): ');

  PRODUCT_NAME = inputName || 'TestProduct_1';
  PRODUCT_SKU  = inputSku  || 'TestSKUId_1';
  UPDATED_SKU  = `${PRODUCT_SKU}_Updated`;

  console.log(`\n🔖 Product Name : ${PRODUCT_NAME}`);
  console.log(`🔖 SKU          : ${PRODUCT_SKU}`);
  console.log(`🔖 Updated SKU  : ${UPDATED_SKU}\n`);

  // ── Login ONCE — session shared across ALL 4 CRUD tests ─────────────────────
  context = await browser.newContext();
  page    = await context.newPage();

  const loginPage     = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  console.log('🔐 Logging in...');
  await loginPage.login();
  await loginPage.verifyLoginSuccess();

  console.log('🏪 Switching merchant...');
  await dashboardPage.switchMerchant();
  await dashboardPage.navigateToProducts();

  console.log('✅ Setup complete — starting CRUD tests\n');
});

test.afterAll(async () => {
  await context.close();
});

// ── TC_PRODUCT_01: CREATE ─────────────────────────────────────────────────────
test('TC_PRODUCT_01 - Create Product - fill title and SKU, save and verify in listing', async () => {
  const productsPage = new ProductsPage(page);

  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  console.log(`\n➕ Creating product: "${PRODUCT_NAME}" with SKU: "${PRODUCT_SKU}"`);
  await productsPage.createProduct(PRODUCT_NAME, PRODUCT_SKU);

  // Navigate back to listing
  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  // Verify product appears in listing
  const isVisible = await productsPage.isProductVisible(PRODUCT_NAME);
  expect(isVisible, `"${PRODUCT_NAME}" should appear in listing after creation`).toBeTruthy();

  // Capture product ID — used in all subsequent tests
  productId = await productsPage.getProductIdByName(PRODUCT_NAME);

  console.log(`✅ CREATE — "${PRODUCT_NAME}" visible in listing | Product ID: ${productId}`);
});

// ── TC_PRODUCT_02: READ / VERIFY ──────────────────────────────────────────────
test('TC_PRODUCT_02 - Read Product - verify product appears in listing with correct name', async () => {
  const productsPage = new ProductsPage(page);

  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  console.log(`\n🔍 Verifying product "${PRODUCT_NAME}" in listing...`);

  // Verify product is in the table
  const isVisible = await productsPage.isProductVisible(PRODUCT_NAME);
  expect(isVisible, `"${PRODUCT_NAME}" should be visible in product listing`).toBeTruthy();

  // Verify the product link has correct text
  const productLink = page.locator(`[data-test-id="products_table_product_link_${productId}"]`);
  await expect(productLink).toBeVisible();
  const linkText = await productLink.textContent();
  expect(linkText?.trim()).toBe(PRODUCT_NAME);

  // Open and verify detail page title
  await productLink.click();
  await page.waitForLoadState('domcontentloaded');
  const titleInput = page.locator('[data-test-id="title_input"]');
  await titleInput.waitFor({ state: 'visible', timeout: 10000 });
  const titleValue = await titleInput.inputValue();
  expect(titleValue).toBe(PRODUCT_NAME);

  console.log(`✅ READ — "${PRODUCT_NAME}" verified in listing and on detail page`);
});

// ── TC_PRODUCT_03: UPDATE (with SKU validation check + successful update) ─────
test('TC_PRODUCT_03 - Update Product - validate empty SKU error then update successfully', async () => {
  const productsPage = new ProductsPage(page);

  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  console.log(`\n✏️  Opening product for update...`);

  // Open product detail page
  const productLink = page.locator(`[data-test-id="products_table_product_link_${productId}"]`);
  await productLink.waitFor({ state: 'visible', timeout: 10000 });
  await productLink.click();
  await page.waitForLoadState('domcontentloaded');

  // Wait for SKU input to be visible
  const skuInput = page.locator('[data-test-id="inventory_card_sku_input"]');
  await skuInput.waitFor({ state: 'visible', timeout: 15000 });

  // ── Step 1: Clear SKU and try to save → expect validation error ─────────────
  console.log('  ⚠️  Testing SKU validation — clearing SKU and saving...');
  await skuInput.clear();
  const saveBtn = page.locator('[data-test-id="product_form_save_button"]');
  await saveBtn.click();
  await page.waitForTimeout(1500);

  const skuError = page.getByText('SKU is required');
  const errorShown = await skuError.isVisible().catch(() => false);
  expect(errorShown, '"SKU is required" validation error should appear').toBeTruthy();
  console.log('  ✅ Validation — "SKU is required" error shown correctly');

  // ── Step 2: Fill updated SKU and save successfully ──────────────────────────
  console.log(`  ✏️  Filling updated SKU: "${UPDATED_SKU}"`);
  await skuInput.fill(UPDATED_SKU);
  await saveBtn.click();
  await page.waitForTimeout(2000);

  // Wait for success — button should go disabled (no unsaved changes)
  await page.waitForLoadState('networkidle').catch(() => {});

  // Navigate back and re-open to confirm SKU persisted
  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  const productLinkAgain = page.locator(`[data-test-id="products_table_product_link_${productId}"]`);
  await productLinkAgain.click();
  await page.waitForLoadState('domcontentloaded');

  const skuInputReloaded = page.locator('[data-test-id="inventory_card_sku_input"]');
  await skuInputReloaded.waitFor({ state: 'visible', timeout: 15000 });
  const savedSku = await skuInputReloaded.inputValue();
  expect(savedSku).toBe(UPDATED_SKU);

  console.log(`✅ UPDATE — SKU updated to "${UPDATED_SKU}" and verified after reload`);
});

// ── TC_PRODUCT_04: DELETE ─────────────────────────────────────────────────────
test('TC_PRODUCT_04 - Delete Product - confirm modal and verify removed from listing', async () => {
  const productsPage = new ProductsPage(page);

  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  console.log(`\n🗑️  Deleting product: "${PRODUCT_NAME}" (ID: ${productId})`);

  // Ensure productId is set — guard against test isolation issue
  expect(productId, 'Product ID must be set from TC_PRODUCT_01').toBeDefined();

  // Select row checkbox
  const checkbox = page.locator(`[data-test-id="generic_table_row_checkbox_${productId}"]`);
  await checkbox.waitFor({ state: 'visible', timeout: 15000 });
  await checkbox.check();

  // More Actions → Delete products
  const moreActions = page.locator('[data-test-id="bulk_action_toolbar_more_actions_button"]');
  await moreActions.waitFor({ state: 'visible', timeout: 8000 });
  await moreActions.click();

  const deleteOption = page.getByText('Delete products');
  await deleteOption.waitFor({ state: 'visible', timeout: 5000 });
  await deleteOption.click();

  // Confirm modal → OK
  const okButton = page.getByRole('button', { name: 'OK' });
  await okButton.waitFor({ state: 'visible', timeout: 8000 });
  await okButton.click();

  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);

  // Navigate back and verify product is gone
  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  const isStillVisible = await productsPage.isProductVisible(PRODUCT_NAME);
  expect(isStillVisible, `"${PRODUCT_NAME}" should NOT appear after deletion`).toBeFalsy();

  console.log(`✅ DELETE — "${PRODUCT_NAME}" confirmed removed from listing`);
});
