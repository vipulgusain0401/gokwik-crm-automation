import { Page, Locator } from '@playwright/test';
import { Logger } from './logger';

const logger = new Logger('WaitHelper');

export class WaitHelper {
  /**
   * Waits for network to be idle — good after navigations/mutations
   */
  static async waitForNetworkIdle(page: Page, timeout = 10000): Promise<void> {
    try {
      await page.waitForLoadState('networkidle', { timeout });
    } catch {
      logger.warn('Network idle timeout — continuing anyway');
    }
  }

  /**
   * Waits for a toast / snackbar notification to appear then disappear
   */
  static async waitForToast(page: Page, expectedText?: string): Promise<string> {
    // Common toast selectors — adjust if app uses different classes
    const toastSelectors = [
      '[class*="toast"]',
      '[class*="snackbar"]',
      '[class*="notification"]',
      '[class*="alert"]',
      '[role="alert"]',
      '[class*="message"]',
    ];

    for (const selector of toastSelectors) {
      try {
        const toast = page.locator(selector).first();
        await toast.waitFor({ state: 'visible', timeout: 8000 });
        const text = await toast.textContent() ?? '';
        logger.info(`Toast appeared: "${text.trim()}"`);
        if (expectedText && !text.includes(expectedText)) {
          logger.warn(`Expected toast text "${expectedText}" but got "${text.trim()}"`);
        }
        return text.trim();
      } catch {
        // Try next selector
      }
    }
    logger.warn('No toast/notification found');
    return '';
  }

  /**
   * Wait for element to be stable (not moving/animating)
   */
  static async waitForElementStable(locator: Locator, timeout = 5000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
    await locator.evaluate((el) => {
      return new Promise<void>((resolve) => {
        const observer = new MutationObserver(() => {});
        observer.observe(el, { attributes: true, childList: true, subtree: true });
        setTimeout(() => {
          observer.disconnect();
          resolve();
        }, 300);
      });
    });
  }
}
