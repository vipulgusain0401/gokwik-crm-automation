import { Page } from '@playwright/test';

// Standalone helper for global-setup.ts which doesn't use BasePage
export async function dismissChatPopup(page: Page): Promise<void> {
  try {
    const chatHeader = page.locator('.chat-header');
    if (await chatHeader.isVisible().catch(() => false)) {
      console.log('  ⚠️  Chat popup detected — closing');
      await page.locator('.chat-header .chat-header-button').last().click();
      await page.waitForTimeout(300);
      console.log('  ✅ Chat popup closed');
    }
  } catch {
    // Not present — continue
  }
}
