import { Page } from '@playwright/test';
import { Logger } from '../utils/logger';
import { WaitHelper } from '../utils/wait-helper';

export class BasePage {
  protected page: Page;
  protected logger: Logger;

  constructor(page: Page, pageName: string) {
    this.page = page;
    this.logger = new Logger(pageName);

    // Automatically dismiss chat popup on every navigation
    // Chat widget appears intermittently on all post-login pages
    this.page.on('load', () => {
      this.dismissChatPopup().catch(() => {});
    });
  }

  // Dismiss AI chat popup if visible
  // Called automatically on every page load + can be called manually before any input
  async dismissChatPopup(): Promise<void> {
    try {
      const chatHeader = this.page.locator('.chat-header');
      const isVisible  = await chatHeader.isVisible();
      if (isVisible) {
        this.logger.warn('Chat popup detected — closing');
        await this.page.locator('.chat-header .chat-header-button').last().click();
        await this.page.waitForTimeout(300);
        this.logger.info('Chat popup closed');
      }
    } catch {
      // Not present or already closed — continue
    }
  }

  async navigateTo(url: string): Promise<void> {
    this.logger.step(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.dismissChatPopup();
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
    await this.dismissChatPopup();
    await WaitHelper.waitForNetworkIdle(this.page);
  }
}
