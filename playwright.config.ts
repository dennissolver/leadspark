// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tools/playwright/tests',
  timeout: 30000,
  retries: 1,
  projects: [
    {
      name: 'clientPortal',
      testMatch: 'e2e/clientPortal.spec.ts',
      use: {
        baseURL: 'http://localhost:3001',
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
      },
      // Corrected webServer command to run both backend and portal
      webServer: {
        command: 'pnpm run dev:backend & pnpm run dev:portal',
        url: 'http://localhost:3001',
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
      },
    },
    {
      name: 'widget',
      testMatch: 'e2e/widgetIntegration.spec.ts',
      use: {
        baseURL: 'http://localhost:3000',
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
      },
      // Corrected webServer command to run both backend and landing page
      webServer: {
        command: 'pnpm run dev:backend & pnpm run dev:landing',
        url: 'http://localhost:3000',
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
      },
    },
    {
      name: 'stripe',
      testMatch: 'e2e/stripeIntegration.spec.ts',
      use: {
        baseURL: 'http://localhost:3000',
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
      },
      // Corrected webServer command to run both backend and landing page
      webServer: {
        command: 'pnpm run dev:backend & pnpm run dev:landing',
        url: 'http://localhost:3000',
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
      },
    },
    {
      name: 'dashboard',
      testMatch: 'e2e/dashboard.spec.ts',
      use: {
        baseURL: 'http://localhost:3001',
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
      },
      // Corrected webServer command to run both backend and portal
      webServer: {
        command: 'pnpm run dev:backend & pnpm run dev:portal',
        url: 'http://localhost:3001',
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
      },
    },
  ],
});
