import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { ENV } from '../config/env.config';

export class LoginPage extends BasePage {
  // Step 1 — Email
  private readonly emailInput = this.page.getByRole('textbox', { name: 'example@email.com' });
  private readonly nextButton = this.page.getByRole('button', { name: 'Next' });

  // Step 2 — Password
  private readonly passwordInput = this.page.locator('input[type="password"]');

  // Step 3 — OTP
  private readonly otpInput = this.page.getByRole('textbox', { name: '******' });

  constructor(page: Page) {
    super(page, 'LoginPage');
  }

  async goto(): Promise<void> {
    await this.navigateTo(`${ENV.BASE_URL}/login`);
  }

  async login(
    email = ENV.LOGIN_EMAIL,
    password = ENV.LOGIN_PASSWORD,
    otp = ENV.OTP
  ): Promise<void> {
    this.logger.step('=== Starting Login Flow ===');

    await this.goto();

    // Step 1: Email → Next
    this.logger.step('Step 1 — Enter email');
    await this.emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.emailInput.fill(email);
    await this.nextButton.click();

    // Step 2: Password → Next
    this.logger.step('Step 2 — Enter password');
    await this.passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.passwordInput.fill(password);
    await this.nextButton.click();

    // Step 3: OTP → Next
    this.logger.step('Step 3 — Enter OTP');
    await this.otpInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.otpInput.fill(otp);
    await this.nextButton.click();

    await this.waitForPageReady();
    this.logger.info('=== Login Complete ===');
  }

  async verifyLoginSuccess(): Promise<void> {
    this.logger.step('Verifying login success');
    await this.page.waitForURL((url) => !url.toString().includes('login'), {
      timeout: 15000,
    });
    this.logger.info(`Redirected to: ${this.page.url()}`);
  }
}
