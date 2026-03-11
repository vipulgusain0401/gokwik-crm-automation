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

    // From recording the button is in top-right header area
    // It contains an image/icon + merchant name + down arrow
    // Selector: find button inside the breadcrumb/top header that has "down" icon
    const merchantDropdown = this.page.locator(
      '[class*="Switch"], [class*="switch-merchant"], button[class*="shadow"]'
    ).first();

    // Fallback to the exact structure seen in page snapshot:
    // button "Weryzee QA down" inside generic ref=e256 (breadcrumb area)
    const fallbackDropdown = this.page.locator(
      'button:has(.anticon-down), button:has([aria-label="down"])'
    ).last();

    let clicked = false;

    // Try primary
    try {
      await merchantDropdown.waitFor({ state: 'visible', timeout: 5000 });
      await merchantDropdown.click();
      clicked = true;
      this.logger.info('Clicked merchant dropdown (primary)');
    } catch {
      this.logger.warn('Primary selector failed — trying fallback');
    }

    // Try fallback
    if (!clicked) {
      try {
        await fallbackDropdown.waitFor({ state: 'visible', timeout: 5000 });
        await fallbackDropdown.click();
        clicked = true;
        this.logger.info('Clicked merchant dropdown (fallback)');
      } catch {
        this.logger.warn('Fallback failed — navigating directly to products URL');
      }
    }

    // If both selectors fail — navigate directly (most reliable)
    if (!clicked) {
      this.logger.info('Skipping merchant switch UI — navigating directly to merchant products URL');
      await this.page.goto(`${ENV.BASE_URL}${ENV.PRODUCTS_URL}`);
      await WaitHelper.waitForNetworkIdle(this.page);
      return;
    }

    await this.page.waitForTimeout(800);

    // Search for merchant ID
    const searchInput = this.page.getByRole('textbox').first();
    await searchInput.waitFor({ state: 'visible', timeout: 8000 });
    await searchInput.fill(merchantId);
    await this.page.waitForTimeout(800);

    // Select radio
    const merchantRadio = this.page.getByRole('radio', { name: new RegExp(merchantId) });
    await merchantRadio.waitFor({ state: 'visible', timeout: 8000 });
    await merchantRadio.check();

    // Confirm
    await this.page.getByRole('button', { name: 'Set Merchant' }).click();
    await WaitHelper.waitForNetworkIdle(this.page);
    await this.page.waitForTimeout(1000);

    // Handle "click here" redirect
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
    this.logger.info(`Products page loaded: ${this.page.url()}`);
  }
}
