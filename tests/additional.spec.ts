import { test, expect, BrowserContext, Page } from '@playwright/test';
import { ENV } from '../config/env.config';
import { DashboardPage } from '../pages/dashboard.page';

// =============================================================================
// SCRIPT 3 — ADDITIONAL / BONUS SCENARIOS
// storageState skips login — switchMerchant still needed for store context
// TC_ADD_01 : Pagination — change page size 5/20/50, navigate next page
// TC_ADD_02 : Negative — submit with empty SKU, validate error message
// =============================================================================

let context: BrowserContext;
let page: Page;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext({ storageState: 'auth/session.json' });
  page    = await context.newPage();

  const dashboardPage = new DashboardPage(page);
  await page.goto(`${ENV.BASE_URL}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  console.log('\n🏪 Switching merchant...');
  await dashboardPage.switchMerchant();
  console.log('✅ Setup complete\n');
});

test.afterAll(async () => {
  await context.close();
});

async function goToProducts() {
  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await page.waitForLoadState('domcontentloaded');
  await page.locator('[data-test-id="products_add_button"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);
}

// ── TC_ADD_01: PAGINATION ─────────────────────────────────────────────────────
test('TC_ADD_01 - Pagination - change page size 5/20/50 and navigate next page', async () => {
  await goToProducts();
  console.log('\n📄 Testing Pagination...');

  const totalText = await page.locator('text=/Total.*Items/i').textContent().catch(() => '');
  console.log(`  ${totalText?.trim()}`);

  const pageSizeDropdown = page.locator('.ant-select-selector').last();

  // Page size: 5
  await pageSizeDropdown.click();
  await page.waitForTimeout(500);
  await page.locator('.ant-select-item-option').filter({ hasText: '5' }).first().click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);
  const countAt5 = await page.locator('.ant-table-tbody .ant-table-row').count();
  expect(countAt5).toBeLessThanOrEqual(5);
  console.log(`  ✅ Page size 5  — ${countAt5} rows`);

  // Page size: 20
  await pageSizeDropdown.click();
  await page.waitForTimeout(500);
  await page.locator('.ant-select-item-option').filter({ hasText: '20' }).first().click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);
  const countAt20 = await page.locator('.ant-table-tbody .ant-table-row').count();
  expect(countAt20).toBeLessThanOrEqual(20);
  expect(countAt20).toBeGreaterThan(countAt5);
  console.log(`  ✅ Page size 20 — ${countAt20} rows`);

  // Page size: 50
  await pageSizeDropdown.click();
  await page.waitForTimeout(500);
  await page.locator('.ant-select-item-option').filter({ hasText: '50' }).first().click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);
  const countAt50 = await page.locator('.ant-table-tbody .ant-table-row').count();
  expect(countAt50).toBeLessThanOrEqual(50);
  expect(countAt50).toBeGreaterThan(countAt20);
  console.log(`  ✅ Page size 50 — ${countAt50} rows`);

  // Next page
  const nextBtn = page.locator('button:has-text("Next")');
  await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
  const isNextDisabled = await nextBtn.isDisabled();

  if (!isNextDisabled) {
    const firstRowPage1 = await page.locator('.ant-table-tbody .ant-table-row').first().textContent();
    await nextBtn.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000);

    const countPage2    = await page.locator('.ant-table-tbody .ant-table-row').count();
    const firstRowPage2 = await page.locator('.ant-table-tbody .ant-table-row').first().textContent();
    expect(countPage2).toBeGreaterThan(0);
    expect(firstRowPage2).not.toBe(firstRowPage1);
    console.log(`  ✅ Next page — ${countPage2} rows, different products shown`);
  } else {
    expect(isNextDisabled).toBeTruthy();
    console.log('  ✅ Single page — Next button correctly disabled');
  }

  console.log(`\n✅ PAGINATION — Page size (5/20/50) and navigation verified`);
});

// ── TC_ADD_02: NEGATIVE — EMPTY SKU ──────────────────────────────────────────
test('TC_ADD_02 - Negative - submit product with empty SKU should show validation error', async () => {
  await goToProducts();
  console.log('\n⚠️  Testing empty SKU validation...');

  await page.locator('[data-test-id="products_add_button"]').click();
  await page.locator('[data-test-id="title_input"]').waitFor({ state: 'visible', timeout: 10000 });

  await page.locator('[data-test-id="title_input"]').fill('NegativeTestProduct');
  await page.locator('.ql-editor').first().fill('Test description');
  await page.locator('[data-test-id="shipping_card_header"]').click();
  await page.locator('[data-test-id="shipping_card_physical_product_checkbox"]').uncheck();

  const skuInput = page.locator('[data-test-id="inventory_card_sku_input"]');
  await skuInput.waitFor({ state: 'visible', timeout: 10000 });
  await skuInput.clear();

  console.log('  Submitting with empty SKU...');
  await page.locator('[data-test-id="create_product_submit_button"]').click();
  await page.waitForTimeout(1500);

  // Validate error message
  const skuError = page.getByText('SKU is required');
  await skuError.waitFor({ state: 'visible', timeout: 8000 });
  await expect(skuError).toBeVisible();
  console.log('  ✅ "SKU is required" error displayed');

  // Validate form not submitted
  await expect(page.locator('[data-test-id="create_product_submit_button"]')).toBeVisible();
  console.log('  ✅ Form not submitted — still on create page');

  // Validate error clears on fill
  await skuInput.fill('NEG_SKU_VALID_001');
  await page.waitForTimeout(800);
  const errorGone = await skuError.isVisible().catch(() => false);
  expect(errorGone).toBeFalsy();
  console.log('  ✅ Error clears once SKU is filled');

  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  console.log('\n✅ NEGATIVE — Empty SKU validation verified correctly');
});
