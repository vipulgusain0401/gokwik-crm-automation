import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { ENV } from '../config/env.config';
import { WaitHelper } from '../utils/wait-helper';

export class DashboardPage extends BasePage {
  // Merchant switcher — exact selectors from recording
  private readonly merchantDropdown = this.page.getByRole('button', { name: /qa\.gokwik/i });
  private readonly merchantSearchInput = this.page.getByRole('textbox');
  private readonly setMerchantButton = this.page.getByRole('button', { name: 'Set Merchant' });

  constructor(page: Page) {
    super(page, 'DashboardPage');
  }

  async switchMerchant(merchantId = ENV.MERCHANT_ID): Promise<void> {
    this.logger.step(`Switching to merchant: ${merchantId}`);

    // Open the merchant dropdown (top-right)
    await this.merchantDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await this.merchantDropdown.click();

    // Search for merchant ID
    await this.merchantSearchInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.merchantSearchInput.fill(merchantId);

    // Select the radio option that appears
    const merchantRadio = this.page.getByRole('radio', { name: new RegExp(merchantId) });
    await merchantRadio.waitFor({ state: 'visible', timeout: 8000 });
    await merchantRadio.check();

    // Confirm selection
    await this.setMerchantButton.click();
    await WaitHelper.waitForNetworkIdle(this.page);
    this.logger.info(`Merchant switched to: ${merchantId}`);
  }

  async navigateToProducts(): Promise<void> {
    this.logger.step('Navigating to Products module');
    await this.page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
    await this.waitForPageReady();
    this.logger.info(`On products page: ${this.page.url()}`);
  }
}
