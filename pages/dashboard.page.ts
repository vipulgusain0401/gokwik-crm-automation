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

    // Dismiss chat before any interaction — inherited from BasePage
    await this.dismissChatPopup();

    const merchantDropdown = this.page.locator('button:has(.anticon-down)').last();

    let clicked = false;
    try {
      await merchantDropdown.waitFor({ state: 'visible', timeout: 8000 });
      await merchantDropdown.click();
      clicked = true;
      this.logger.info('Merchant dropdown opened');
    } catch {
      this.logger.warn('Dropdown click failed — navigating directly to products URL');
    }

    if (!clicked) {
      await this.page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
      await WaitHelper.waitForNetworkIdle(this.page);
      return;
    }

    await this.page.waitForTimeout(800);
    await this.dismissChatPopup(); // Can reappear after dropdown click

    const searchInput = this.page.getByRole('textbox').first();
    await searchInput.waitFor({ state: 'visible', timeout: 8000 });
    await searchInput.click();
    await this.page.waitForTimeout(300);
    await searchInput.fill(merchantId);
    await this.page.waitForTimeout(800);

    // Click label wrapping radio — exact selector from page inspection
    const merchantLabel = this.page.locator(`label.ant-radio-wrapper:has(input[value="${merchantId}"])`);
    await merchantLabel.waitFor({ state: 'visible', timeout: 8000 });
    await merchantLabel.click();

    await this.page.getByRole('button', { name: 'Set Merchant' }).click();
    await WaitHelper.waitForNetworkIdle(this.page);
    await this.page.waitForTimeout(1000);

    const clickHere = this.page.getByText('click here');
    if (await clickHere.isVisible().catch(() => false)) {
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
  }
}
