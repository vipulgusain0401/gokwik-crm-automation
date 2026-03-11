import { chromium, FullConfig } from '@playwright/test';
import { ENV } from './config/env.config';
import { dismissChatPopup } from './utils/dismiss-chat';

async function globalSetup(config: FullConfig) {
  console.log('\n🔐 [Global Setup] Logging in and saving session...');

  const browser = await chromium.launch({ headless: false });
  const page    = await browser.newPage();

  // Step 2: Email → Next
  await page.goto(`${ENV.BASE_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByRole('textbox', { name: 'example@email.com' }).fill(ENV.LOGIN_EMAIL);
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 3: Password → Next
  await page.locator('input[type="password"]').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('input[type="password"]').fill(ENV.LOGIN_PASSWORD);
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 4: OTP → Next
  await page.getByRole('textbox', { name: '******' }).waitFor({ state: 'visible', timeout: 10000 });
  await page.getByRole('textbox', { name: '******' }).fill(ENV.OTP);
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 5: Wait for dashboard
  await page.waitForURL(
    (url) => !url.toString().includes('login') && !url.toString().includes('verify-otp'),
    { timeout: 20000 }
  );
  console.log('  ✅ Logged in — dashboard reached');

  // Step 6: Switch merchant
  await page.waitForTimeout(2000);
  await dismissChatPopup(page); // Chat may appear right after login

  const merchantDropdown = page.locator('button:has(.anticon-down)').last();
  await merchantDropdown.waitFor({ state: 'visible', timeout: 10000 });
  await merchantDropdown.click();
  await page.waitForTimeout(800);

  await dismissChatPopup(page); // Chat can reappear after dropdown click

  const searchInput = page.getByRole('textbox').first();
  await searchInput.waitFor({ state: 'visible', timeout: 8000 });
  await searchInput.click();
  await page.waitForTimeout(300);
  await searchInput.fill(ENV.MERCHANT_ID);
  await page.waitForTimeout(800);

  const merchantLabel = page.locator(`label.ant-radio-wrapper:has(input[value="${ENV.MERCHANT_ID}"])`);
  await merchantLabel.waitFor({ state: 'visible', timeout: 8000 });
  await merchantLabel.click();

  await page.getByRole('button', { name: 'Set Merchant' }).click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(1000);

  const clickHere = page.getByText('click here');
  if (await clickHere.isVisible().catch(() => false)) {
    await clickHere.click();
    await page.waitForLoadState('networkidle').catch(() => {});
  }

  console.log(`  ✅ Merchant switched to: ${ENV.MERCHANT_ID}`);

  // Step 7: Save session
  await page.context().storageState({ path: 'auth/session.json' });
  console.log('  ✅ Session saved to auth/session.json');
  console.log('  ✅ [Global Setup] Complete\n');

  await browser.close();
}

export default globalSetup;
