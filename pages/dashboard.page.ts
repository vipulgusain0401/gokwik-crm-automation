import { Page } from '@playwright/test';
import { BasePage } from './base.page';
import { ENV } from '../config/env.config';
import { WaitHelper } from '../utils/wait-helper';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page, 'DashboardPage');
  }

  async switchMerchant(merchantId = ENV.MERCHANT_ID): Promise<void> {
    this.logger.step(`Switching to merchant: ${merchantId}`);

    // From recording: button name is "[MerchantName] down" — matches any button with "down" in name
    // This covers: "qa.gokwik down", "Weryzee QA down", or any other merchant name
    const merchantDropdown = this.page.getByRole('button', { name: /down$/i }).last();

    await merchantDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await merchantDropdown.click();
    this.logger.info('Merchant dropdown opened');

    await this.page.waitForTimeout(800);

    // Search for merchant ID in the modal
    const searchInput = this.page.getByRole('textbox').first();
    await searchInput.waitFor({ state: 'visible', timeout: 8000 });
    await searchInput.fill(merchantId);
    await this.page.waitForTimeout(800);

    // Select the radio for matching merchant
    const merchantRadio = this.page.getByRole('radio', { name: new RegExp(merchantId) });
    await merchantRadio.waitFor({ state: 'visible', timeout: 8000 });
    await merchantRadio.check();

    // Click Set Merchant
    await this.page.getByRole('button', { name: 'Set Merchant' }).click();
    await WaitHelper.waitForNetworkIdle(this.page);
    await this.page.waitForTimeout(1000);

    // Handle "click here" redirect if it appears post-switch
    const clickHere = this.page.getByText('click here');
    const clickHereVisible = await clickHere.isVisible().catch(() => false);
    if (clickHereVisible) {
      await clickHere.click();
      await WaitHelper.waitForNetworkIdle(this.page);
    }

    this.logger.info(`Merchant switched to: ${merchantId}`);
  }

  async navigateToProducts(): Promise<void> {
    this.logger.step('Navigating to Products module');
    await this.page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
    await this.page.waitForLoadState('domcontentloaded');
    await WaitHelper.waitForNetworkIdle(this.page);
    this.logger.info(`On products page: ${this.page.url()}`);
  }
}
