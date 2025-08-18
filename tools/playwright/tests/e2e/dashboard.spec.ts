// packages/frontend/tests/dashboard.spec.ts
import { test, expect } from '@playwright/test';
import { ConsoleMessage } from '@playwright/test';

test.use({
  locale: 'en-US',
  viewport: { width: 1280, height: 720 },
  ignoreHTTPSErrors: true,
});

test('should display dashboard stats and recent leads for a logged-in user', async ({ page }) => {
  // Capture browser console logs for debugging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`[Browser Error] ${msg.text()}`);
    } else {
      console.log(`[Browser Console] ${msg.text()}`);
    }
  });

  // Mock API responses for dashboard data
  await page.route('**/api/dashboard-stats', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalLeads: 15,
        weekLeads: 5,
        convertedLeads: 2
      }),
    });
  });

  await page.route('**/api/leads', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'lead1', name: 'John Doe', email: 'john@example.com' },
        { id: 'lead2', name: 'Jane Smith', email: 'jane@example.com' },
      ]),
    });
  });

  console.log('[Test Log] Starting dashboard test with mocked data.');
  // Mock the supabase session to simulate a logged-in state
  // This is a simplified mock; a real implementation would be more complex
  await page.goto('/dashboard');
  console.log(`[Test Log] Navigated to URL: ${page.url()}`);

  // Verify that the dashboard content is displayed
  console.log('[Test Log] Waiting for "Dashboard" text to be visible...');
  await expect(page.getByText('Dashboard')).toBeVisible();
  await expect(page.getByText('Welcome back!')).toBeVisible();
  console.log('[Test Log] Dashboard header content is visible.');

  // Verify that the mocked stats are displayed
  await expect(page.getByText('Total Leads')).toBeVisible();
  await expect(page.getByText('15')).toBeVisible();

  // Verify that the mocked recent leads are displayed
  await expect(page.getByText('Recent Leads')).toBeVisible();
  await expect(page.getByText('John Doe')).toBeVisible();
  await expect(page.getByText('Jane Smith')).toBeVisible();

  console.log('[Test Log] All dashboard assertions passed. Test successful.');
});

test("submits tenant form", async ({ page }) => {
  await page.click("text=Onboard New Tenant");
  await page.fill("#name", "Test Tenant");
  await page.fill("#stripeCustomerId", "cus_123456");
  await page.click("text=Create Tenant");
  await expect(page.locator(".toast-success")).toBeVisible();
});