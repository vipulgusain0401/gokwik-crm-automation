import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },

  reporter: [
    ['html', { outputFolder: 'reports/html-report', open: 'always' }],
    ['list'],
  ],

  use: {
    baseURL: 'https://qa-mdashboard.dev.gokwik.in',
    headless: false,
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
