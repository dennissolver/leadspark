import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tools/playwright/tests',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
