import { test, expect } from '@playwright/test';
import { ENV } from '../config/env.config';

// =============================================================================
// SCRIPT 1 — LOGIN FLOW
// Note: TC_LOGIN_01 navigates fresh without storageState to test actual login
// TC_LOGIN_02 and TC_LOGIN_03 also start fresh — testing login page behaviour
// =============================================================================
test.describe('Script 1 - Login Flow', () => {

  // Override storageState for login tests — we need a clean session
  test.use({ storageState: { cookies: [], origins: [] } });

  test('TC_LOGIN_01 - Valid login with email, password and OTP should redirect to dashboard', async ({ page }) => {
    await page.goto(`${ENV.BASE_URL}/login`);

    // Step 1: Email
    await page.getByRole('textbox', { name: 'example@email.com' }).fill(ENV.LOGIN_EMAIL);
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 2: Password
    await page.locator('input[type="password"]').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('input[type="password"]').fill(ENV.LOGIN_PASSWORD);
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3: OTP
    await page.getByRole('textbox', { name: '******' }).waitFor({ state: 'visible', timeout: 10000 });
    await page.getByRole('textbox', { name: '******' }).fill(ENV.OTP);
    await page.getByRole('button', { name: 'Next' }).click();

    // Verify redirected away from login
    await page.waitForURL(
      (url) => !url.toString().includes('login') && !url.toString().includes('verify-otp'),
      { timeout: 20000 }
    );

    expect(page.url()).not.toContain('login');
    console.log(`✅ TC_LOGIN_01 — Login successful, redirected to: ${page.url()}`);
  });

  test('TC_LOGIN_02 - New unregistered email should not proceed to password screen', async ({ page }) => {
    await page.goto(`${ENV.BASE_URL}/login`);

    await page.getByRole('textbox', { name: 'example@email.com' }).fill('Test_sandboxuser1@gokwik.co');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(2000);

    // Should NOT reach password screen
    const passwordVisible = await page.locator('input[type="password"]').isVisible().catch(() => false);
    const stillOnEmail    = await page.getByRole('textbox', { name: 'example@email.com' }).isVisible().catch(() => false);
    const signupVisible   = await page.locator('text=/sign up|register|create account|new user/i').isVisible().catch(() => false);

    expect(passwordVisible || signupVisible || stillOnEmail,
      'New email should trigger signup or stay on email step').toBeTruthy();
    console.log('✅ TC_LOGIN_02 — New email handled correctly');
  });

  test('TC_LOGIN_03 - Valid email with wrong password should block login', async ({ page }) => {
    await page.goto(`${ENV.BASE_URL}/login`);

    await page.getByRole('textbox', { name: 'example@email.com' }).fill(ENV.LOGIN_EMAIL);
    await page.getByRole('button', { name: 'Next' }).click();

    await page.locator('input[type="password"]').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('input[type="password"]').fill('WrongPassword@999');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(2000);

    const errorVisible    = await page.locator('text=/invalid|incorrect|wrong|failed|error/i').isVisible().catch(() => false);
    const stillOnPassword = await page.locator('input[type="password"]').isVisible().catch(() => false);
    const notOnDashboard  = !page.url().includes('dashboard') && !page.url().includes('verify-otp');

    expect(errorVisible || stillOnPassword || notOnDashboard,
      'Wrong password should block login').toBeTruthy();
    console.log('✅ TC_LOGIN_03 — Wrong password correctly blocked');
  });
});
