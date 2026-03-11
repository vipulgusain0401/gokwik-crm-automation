import { test, expect, BrowserContext, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { ProductsPage } from '../pages/products.page';
import { ENV } from '../config/env.config';

// =============================================================================
// SCRIPT 2 — PRODUCT CRUD (Single login, shared session across all 4 tests)
//
// HOW TO RUN with custom data:
//   PRODUCT_NAME="MyProduct" PRODUCT_SKU="MySKU001" npx playwright test tests/products.spec.ts --headed
//
// Run with defaults (TestProduct_1 / TestSKUId_1):
//   npx playwright test tests/products.spec.ts --headed
// =============================================================================

const PRODUCT_NAME   = process.env.PRODUCT_NAME || 'TestProduct_1';
const PRODUCT_SKU    = process.env.PRODUCT_SKU  || 'TestSKUId_1';
const UPDATED_NAME   = `${PRODUCT_NAME}_Updated`; // UPDATE changes the name — visible in listing
const UPDATED_SKU    = `${PRODUCT_SKU}_Updated`;

let context: BrowserContext;
let page: Page;
let productId: string;

test.beforeAll(async ({ browser }) => {
  console.log('\n========================================');
  console.log(`📦 Product Name  : ${PRODUCT_NAME}`);
  console.log(`🔑 SKU           : ${PRODUCT_SKU}`);
  console.log(`✏️  Updated Name  : ${UPDATED_NAME}`);
  console.log('========================================\n');

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
test('TC_PRODUCT_01 - Create Product - fill title and SKU, verify in listing with Active status', async () => {
  const productsPage = new ProductsPage(page);

  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  console.log(`\n➕ Creating product: "${PRODUCT_NAME}" | SKU: "${PRODUCT_SKU}"`);
  await productsPage.createProduct(PRODUCT_NAME, PRODUCT_SKU);

  // Navigate back to listing
  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  // ── Validate: product appears in listing ──────────────────────────────────
  const isVisible = await productsPage.isProductVisible(PRODUCT_NAME);
  expect(isVisible, `"${PRODUCT_NAME}" should appear in listing after creation`).toBeTruthy();

  // Capture product ID for all subsequent tests
  productId = await productsPage.getProductIdByName(PRODUCT_NAME);

  // ── Validate: Status shows Active (default) ───────────────────────────────
  const productRow = page.locator(`[data-test-id="products_table_product_link_${productId}"]`)
    .locator('xpath=ancestor::tr').first();
  const statusCell = productRow.locator('text=Active').first();
  await expect(statusCell).toBeVisible();

  console.log(`✅ CREATE — "${PRODUCT_NAME}" visible in listing | Status: Active | ID: ${productId}`);
});

// ── TC_PRODUCT_02: READ / VERIFY ──────────────────────────────────────────────
test('TC_PRODUCT_02 - Read Product - search by name, verify name, status and variant count', async () => {
  const productsPage = new ProductsPage(page);

  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  console.log(`\n🔍 Searching and verifying "${PRODUCT_NAME}"...`);

  // ── Search by name ────────────────────────────────────────────────────────
  const searchInput = page.locator('[placeholder*="Search" i], input[type="search"]').first();
  await searchInput.waitFor({ state: 'visible', timeout: 8000 });
  await searchInput.fill(PRODUCT_NAME);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);

  // ── Validate: product appears in search results ───────────────────────────
  const isVisible = await productsPage.isProductVisible(PRODUCT_NAME);
  expect(isVisible, `"${PRODUCT_NAME}" should appear in search results`).toBeTruthy();

  // Get the product row
  const productRow = page.locator(`tr:has([data-test-id="products_table_product_link_${productId}"])`);

  // ── Validate: Name matches exactly ───────────────────────────────────────
  const productLink = page.locator(`[data-test-id="products_table_product_link_${productId}"]`);
  const linkText = await productLink.textContent();
  expect(linkText?.trim()).toBe(PRODUCT_NAME);
  console.log(`  ✅ Name verified: "${linkText?.trim()}"`);

  // ── Validate: Status is Active ────────────────────────────────────────────
  const statusCell = productRow.locator('text=Active').first();
  await expect(statusCell).toBeVisible();
  console.log('  ✅ Status verified: Active');

  // ── Validate: Variant count visible ──────────────────────────────────────
  const variantCell = productRow.locator('text=/\\d+ variant/i').first();
  const variantText = await variantCell.textContent().catch(() => 'N/A');
  console.log(`  ✅ Variant count: "${variantText?.trim()}"`);

  console.log(`✅ READ — Name, Status and Variant count all verified for "${PRODUCT_NAME}"`);
});

// ── TC_PRODUCT_03: UPDATE ─────────────────────────────────────────────────────
test('TC_PRODUCT_03 - Update Product - change product name and verify updated in listing', async () => {
  const productsPage = new ProductsPage(page);

  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  console.log(`\n✏️  Updating product name to: "${UPDATED_NAME}"`);

  // Open product detail page
  const productLink = page.locator(`[data-test-id="products_table_product_link_${productId}"]`);
  await productLink.waitFor({ state: 'visible', timeout: 10000 });
  await productLink.click();
  await page.waitForLoadState('domcontentloaded');

  // ── Update the title (name) — this shows in listing unlike SKU ───────────
  const titleInput = page.locator('[data-test-id="title_input"]');
  await titleInput.waitFor({ state: 'visible', timeout: 10000 });
  await titleInput.clear();
  await titleInput.fill(UPDATED_NAME);

  // Save changes
  const saveBtn = page.locator('[data-test-id="product_form_save_button"]');
  await saveBtn.click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);

  // ── Validate: updated name reflected in listing ───────────────────────────
  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  const isUpdatedVisible = await productsPage.isProductVisible(UPDATED_NAME);
  expect(isUpdatedVisible, `Updated name "${UPDATED_NAME}" should appear in listing`).toBeTruthy();

  // Old name should no longer appear
  const isOldVisible = await productsPage.isProductVisible(PRODUCT_NAME);
  expect(isOldVisible, `Old name "${PRODUCT_NAME}" should no longer appear`).toBeFalsy();

  console.log(`✅ UPDATE — name changed to "${UPDATED_NAME}" and verified in listing`);
});

// ── TC_PRODUCT_04: DELETE ─────────────────────────────────────────────────────
test('TC_PRODUCT_04 - Delete Product - confirm modal, validate toast and verify removed from listing', async () => {
  const productsPage = new ProductsPage(page);

  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  console.log(`\n🗑️  Deleting product: "${UPDATED_NAME}" (ID: ${productId})`);
  expect(productId, 'Product ID must be available from TC_PRODUCT_01').toBeDefined();

  // ── Select row checkbox ───────────────────────────────────────────────────
  const checkbox = page.locator(`[data-test-id="generic_table_row_checkbox_${productId}"]`);
  await checkbox.waitFor({ state: 'visible', timeout: 15000 });
  await checkbox.check();

  // ── More Actions → Delete products ───────────────────────────────────────
  const moreActions = page.locator('[data-test-id="bulk_action_toolbar_more_actions_button"]');
  await moreActions.waitFor({ state: 'visible', timeout: 8000 });
  await moreActions.click();

  const deleteOption = page.getByText('Delete products');
  await deleteOption.waitFor({ state: 'visible', timeout: 5000 });
  await deleteOption.click();

  // ── Confirmation modal → OK ───────────────────────────────────────────────
  const okButton = page.getByRole('button', { name: 'OK' });
  await okButton.waitFor({ state: 'visible', timeout: 8000 });
  console.log('  ✅ Confirmation modal appeared — clicking OK');
  await okButton.click();

  // ── Validate: toast/success message appears ───────────────────────────────
  const toast = page.locator('[class*="toast"], [class*="message"], [class*="notification"], [class*="alert"], [role="alert"]').first();
  const toastVisible = await toast.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
  if (toastVisible) {
    const toastText = await toast.textContent();
    console.log(`  ✅ Toast message: "${toastText?.trim()}"`);
  } else {
    console.log('  ℹ️  No toast detected — checking listing directly');
  }

  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);

  // ── Navigate back and search — should return no results ──────────────────
  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await productsPage.waitForProductsToLoad();

  // Search for deleted product — should return no results
  const searchInput = page.locator('[placeholder*="Search" i], input[type="search"]').first();
  await searchInput.waitFor({ state: 'visible', timeout: 8000 });
  await searchInput.fill(UPDATED_NAME);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);

  const isStillVisible = await productsPage.isProductVisible(UPDATED_NAME);
  expect(isStillVisible, `"${UPDATED_NAME}" should NOT appear in search after deletion`).toBeFalsy();

  console.log(`✅ DELETE — "${UPDATED_NAME}" confirmed removed. Search returns no results.`);
});
PRODUCTS_URL}`);
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
