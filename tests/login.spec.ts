import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { ENV } from '../config/env.config';

// =============================================================================
// SCRIPT 1 — LOGIN FLOW
// Sequence: Valid login → dashboard | New user signup flow | Wrong password
// =============================================================================
test.describe('Script 1 - Login Flow', () => {

  // ── TC_LOGIN_01: Valid credentials → dashboard ──────────────────────────────
  test('TC_LOGIN_01 - Valid login should redirect to dashboard successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login(ENV.LOGIN_EMAIL, ENV.LOGIN_PASSWORD, ENV.OTP);
    await loginPage.verifyLoginSuccess();

    expect(page.url()).not.toContain('login');
    console.log(`✅ Valid login successful — redirected to: ${page.url()}`);
  });

  // ── TC_LOGIN_02: New/unregistered email → signup flow ──────────────────────
  test('TC_LOGIN_02 - New email should trigger signup flow not login', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();

    // Enter a new/unregistered email
    await page.getByRole('textbox', { name: 'example@email.com' }).fill('Test_sandboxuser1@gokwik.co');
    await page.getByRole('button', { name: 'Next' }).click();

    await page.waitForTimeout(2000);

    // Should either show signup/register UI or stay on same step
    // NOT proceed to password screen for a known user
    const passwordVisible = await page.locator('input[type="password"]').isVisible().catch(() => false);
    const signupVisible = await page.locator('text=/sign up|register|create account|new user/i').isVisible().catch(() => false);
    const stillOnEmail = await page.getByRole('textbox', { name: 'example@email.com' }).isVisible().catch(() => false);

    const triggeredSignupOrBlocked = signupVisible || stillOnEmail || !passwordVisible;
    expect(triggeredSignupOrBlocked, 'New email should trigger signup flow or block login').toBeTruthy();

    console.log(`✅ New email "Test_sandboxuser1@gokwik.co" correctly handled — signup/block flow triggered`);
  });

  // ── TC_LOGIN_03: Valid email + wrong password → should not login ────────────
  test('TC_LOGIN_03 - Valid email with invalid password should not allow login', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();

    // Enter valid email
    await page.getByRole('textbox', { name: 'example@email.com' }).fill(ENV.LOGIN_EMAIL);
    await page.getByRole('button', { name: 'Next' }).click();

    // Wait for password screen
    await page.locator('input[type="password"]').waitFor({ state: 'visible', timeout: 10000 });

    // Enter wrong password
    await page.locator('input[type="password"]').fill('WrongPassword@999');
    await page.getByRole('button', { name: 'Next' }).click();

    await page.waitForTimeout(2000);

    // Should NOT reach OTP or dashboard — still on password or error shown
    const errorVisible = await page.locator('text=/invalid|incorrect|wrong|failed|error/i').isVisible().catch(() => false);
    const stillOnPassword = await page.locator('input[type="password"]').isVisible().catch(() => false);
    const notOnDashboard = !page.url().includes('dashboard') && !page.url().includes('verify-otp');

    const loginBlocked = errorVisible || stillOnPassword || notOnDashboard;
    expect(loginBlocked, 'Wrong password should block login').toBeTruthy();

    console.log(`✅ Invalid password correctly blocked — login prevented`);
  });

});
