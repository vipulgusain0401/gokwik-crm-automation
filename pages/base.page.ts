import { Page } from '@playwright/test';
import { Logger } from '../utils/logger';
import { WaitHelper } from '../utils/wait-helper';

export class BasePage {
  protected page: Page;
  protected logger: Logger;

  constructor(page: Page, pageName: string) {
    this.page = page;
    this.logger = new Logger(pageName);
  }

  async navigateTo(url: string): Promise<void> {
    this.logger.step(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await WaitHelper.waitForNetworkIdle(this.page);
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `reports/screenshots/${name}_${Date.now()}.png`,
      fullPage: true,
    });
    this.logger.info(`Screenshot saved: ${name}`);
  }

  async waitForPageReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await WaitHelper.waitForNetworkIdle(this.page);
  }
}
