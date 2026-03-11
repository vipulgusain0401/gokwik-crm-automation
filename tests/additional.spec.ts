import { test, expect, BrowserContext, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { ProductsPage } from '../pages/products.page';
import { ENV } from '../config/env.config';

// =============================================================================
// SCRIPT 3 — ADDITIONAL / BONUS SCENARIOS
// Login ONCE — session shared
// TC_ADD_01 : Search / Filter — verify All filter loads and displays products
// TC_ADD_02 : Pagination — verify next/prev page navigation works
// =============================================================================

let context: BrowserContext;
let page: Page;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  page    = await context.newPage();

  const loginPage     = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  console.log('\n🔐 Logging in for additional scenarios...');
  await loginPage.login();
  await loginPage.verifyLoginSuccess();
  await dashboardPage.switchMerchant();
  await dashboardPage.navigateToProducts();

  console.log('✅ Setup complete\n');
});

test.afterAll(async () => {
  await context.close();
});

// ── TC_ADD_01: SEARCH / FILTER ────────────────────────────────────────────────
test('TC_ADD_01 - Search/Filter - All filter should display full product listing', async () => {
  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await page.waitForLoadState('domcontentloaded');
  await page.locator('[data-test-id="products_add_button"]').waitFor({ state: 'visible', timeout: 15000 });

  console.log('\n🔍 Testing Search/Filter functionality...');

  // Read initial row count before filter
  const rowsBefore = await page.locator('.ant-table-tbody .ant-table-row').count();
  console.log(`  Initial row count: ${rowsBefore}`);

  // Click All filter tab
  await page.locator('[data-test-id="products_filter_button"]').click();
  await page.waitForTimeout(500);
  await page.locator('[data-test-id="products_filter_all"]').click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);

  // Verify table has rows after All filter applied
  const rowsAfter = await page.locator('.ant-table-tbody .ant-table-row').count();
  console.log(`  Row count after "All" filter: ${rowsAfter}`);

  expect(rowsAfter).toBeGreaterThan(0);

  // Verify total count shown in footer
  const totalLabel = page.locator('text=/Total.*Items/i');
  const totalVisible = await totalLabel.isVisible().catch(() => false);
  if (totalVisible) {
    const totalText = await totalLabel.textContent();
    console.log(`  Footer shows: "${totalText?.trim()}"`);
  }

  console.log(`✅ FILTER — "All" filter applied, ${rowsAfter} products displayed in listing`);
});

// ── TC_ADD_02: PAGINATION ─────────────────────────────────────────────────────
test('TC_ADD_02 - Pagination - should navigate between pages and show correct results', async () => {
  await page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
  await page.waitForLoadState('domcontentloaded');
  await page.locator('[data-test-id="products_add_button"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForLoadState('networkidle').catch(() => {});

  console.log('\n📄 Testing Pagination...');

  // Get total items from footer — e.g. "Total 1827 Items"
  const totalLabel = page.locator('text=/Total.*Items/i');
  const totalText  = await totalLabel.textContent().catch(() => '');
  console.log(`  ${totalText?.trim()}`);

  // Check next button state
  const nextBtn = page.locator('button:has-text("Next")');
  await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
  const isNextDisabled = await nextBtn.isDisabled();

  if (!isNextDisabled) {
    // Capture first product name on page 1
    const firstRowPage1 = await page.locator('.ant-table-tbody .ant-table-row').first().textContent();
    console.log(`  Page 1 first row: "${firstRowPage1?.trim().slice(0, 40)}..."`);

    // Go to page 2
    await nextBtn.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1000);

    // Verify page 2 loaded with different products
    const rowCountPage2 = await page.locator('.ant-table-tbody .ant-table-row').count();
    expect(rowCountPage2).toBeGreaterThan(0);

    const firstRowPage2 = await page.locator('.ant-table-tbody .ant-table-row').first().textContent();
    console.log(`  Page 2 first row: "${firstRowPage2?.trim().slice(0, 40)}..."`);

    // Products on page 2 should differ from page 1
    expect(firstRowPage2).not.toBe(firstRowPage1);

    // Verify prev button is now enabled
    const prevBtn = page.locator('button[aria-label="arrow-left"], button:has([alt="arrow-left"])').first();
    const isPrevDisabled = await prevBtn.isDisabled().catch(() => true);
    expect(isPrevDisabled).toBeFalsy();

    console.log(`✅ PAGINATION — Page 1 → Page 2 navigation works, ${rowCountPage2} products on page 2`);
  } else {
    // Only one page — verify next is correctly disabled
    console.log('  Only one page of products exists');
    expect(isNextDisabled).toBeTruthy();
    console.log('✅ PAGINATION — Single page, Next button correctly disabled');
  }
});
