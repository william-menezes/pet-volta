import { defineConfig } from '@playwright/test';

const baseURL = process.env['BASE_URL'] ?? 'http://localhost:4200';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: process.env['E2E_WEB_SERVER'] === '1'
    ? {
      command: 'npm start',
      url: baseURL,
      reuseExistingServer: true,
      timeout: 120_000,
    }
    : undefined,
});

