import { chromium, FullConfig } from '@playwright/test';
import { ENV } from './config/env.config';

// =============================================================================
// GLOBAL SETUP — Runs ONCE before all test scripts
// Logs in, switches merchant, saves session to auth/session.json
// All 3 scripts reuse this session — no repeated logins, no conflicts
// =============================================================================

async function globalSetup(config: FullConfig) {
  console.log('\n🔐 [Global Setup] Logging in and saving session...');

  const browser = await chromium.launch({ headless: false });
  const page    = await browser.newPage();

  // ── Step 1: Navigate to login ─────────────────────────────────────────────
  await page.goto(`${ENV.BASE_URL}/login`);
  await page.waitForLoadState('domcontentloaded');

  // ── Step 2: Email → Next ──────────────────────────────────────────────────
  await page.getByRole('textbox', { name: 'example@email.com' }).fill(ENV.LOGIN_EMAIL);
  await page.getByRole('button', { name: 'Next' }).click();

  // ── Step 3: Password → Next ───────────────────────────────────────────────
  await page.locator('input[type="password"]').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('input[type="password"]').fill(ENV.LOGIN_PASSWORD);
  await page.getByRole('button', { name: 'Next' }).click();

  // ── Step 4: OTP → Next ────────────────────────────────────────────────────
  await page.getByRole('textbox', { name: '******' }).waitFor({ state: 'visible', timeout: 10000 });
  await page.getByRole('textbox', { name: '******' }).fill(ENV.OTP);
  await page.getByRole('button', { name: 'Next' }).click();

  // ── Step 5: Wait for dashboard ────────────────────────────────────────────
  await page.waitForURL((url) => !url.toString().includes('login') && !url.toString().includes('verify-otp'), {
    timeout: 20000,
  });
  console.log('  ✅ Logged in — dashboard reached');

  // ── Step 6: Switch merchant ───────────────────────────────────────────────
  await page.waitForTimeout(2000);

  const merchantDropdown = page.locator('button:has(.anticon-down)').last();
  await merchantDropdown.waitFor({ state: 'visible', timeout: 10000 });
  await merchantDropdown.click();
  await page.waitForTimeout(800);

  const searchInput = page.getByRole('textbox').first();
  await searchInput.waitFor({ state: 'visible', timeout: 8000 });
  await searchInput.fill(ENV.MERCHANT_ID);
  await page.waitForTimeout(800);

  // Click the label wrapping the radio input — exact selector from page inspection
  const merchantLabel = page.locator(`label.ant-radio-wrapper:has(input[value="${ENV.MERCHANT_ID}"])`);
  await merchantLabel.waitFor({ state: 'visible', timeout: 8000 });
  await merchantLabel.click();

  await page.getByRole('button', { name: 'Set Merchant' }).click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);

  // Handle "click here" redirect if shown
  const clickHere = page.getByText('click here');
  if (await clickHere.isVisible().catch(() => false)) {
    await clickHere.click();
    await page.waitForLoadState('networkidle').catch(() => {});
  }

  console.log(`  ✅ Merchant switched to: ${ENV.MERCHANT_ID}`);

  // ── Step 7: Save session state to file ────────────────────────────────────
  await page.context().storageState({ path: 'auth/session.json' });
  console.log('  ✅ Session saved to auth/session.json');
  console.log('  ✅ [Global Setup] Complete — all scripts will reuse this session\n');

  await browser.close();
}

export default globalSetup;
