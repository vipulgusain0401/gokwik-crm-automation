import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // Scripts run sequentially (login.spec → products.spec → additional.spec)
  // Within products.spec tests must be sequential (CRUD depends on shared state)
  fullyParallel: false,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,

  // Parallel execution: run the 3 spec FILES in parallel (each file = 1 worker)
  // products.spec and additional.spec each login independently so this is safe
  workers: process.env.CI ? 1 : 3,

  timeout: 90000,
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
