import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // Global setup — login once, save session, all scripts reuse it
  globalSetup: './global-setup.ts',

  // Scripts can now run in parallel safely — each uses the saved session file
  // No concurrent logins — no session conflicts
  fullyParallel: false, // Keep false — CRUD tests depend on sequential order within products.spec
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 3, // 3 spec files run in parallel locally

  timeout: 90000,
  expect: { timeout: 10000 },

  reporter: [
    ['html', { outputFolder: 'reports/html-report', open: 'always' }],
    ['list'],
  ],

  use: {
    baseURL: 'https://qa-mdashboard.dev.gokwik.in',
    headless: false,
    storageState: 'auth/session.json', // All scripts reuse saved session — no re-login
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
