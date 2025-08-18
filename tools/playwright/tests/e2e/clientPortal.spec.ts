// tools/playwright/tests/e2e/clientPortal.spec.ts
import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

test.describe('Client Portal Multi-tenancy and Dashboard', () => {

  test('should allow a new user to sign up and view their dashboard', async ({ page }) => {
    // Capture browser console logs for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[Browser Error] ${msg.text()}`);
      } else {
        console.log(`[Browser Console] ${msg.text()}`);
      }
    });

    // 1. Create a unique ID for the tenant to ensure test isolation
    const tenantId = uuidv4();
    const userEmail = `testuser-${Date.now()}@example.com`;
    const userPassword = 'securepassword123';

    console.log(`[Test Log] Starting signup test for user: ${userEmail}`);

    // 2. Navigate to the signup page.
    await page.goto('/signup');
    console.log(`[Test Log] Navigated to URL: ${page.url()}`);

    // 3. Fill out the signup form and click the button
    await page.getByLabel('Company Name').fill('Test Company');
    await page.getByLabel('Email').fill(userEmail);
    await page.getByLabel('Password').fill(userPassword);
    console.log(`[Test Log] Filled out signup form.`);

    // Use a more specific selector to avoid the 'strict mode violation'
    await page.getByRole('button', { name: 'Sign up', exact: true }).click();
    console.log('[Test Log] Clicked "Sign up" button.');

    // 4. Wait for navigation to the dashboard and check the URL
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    console.log(`[Test Log] Redirected to URL: ${page.url()}`);
    await expect(page).toHaveURL(/dashboard/);

    // 5. Verify dashboard content is visible
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Welcome back!')).toBeVisible();

    console.log('[Test Log] Dashboard content is visible. Signup test passed.');
  });

  test('allows a user to login and view their dashboard', async ({ page }) => {
    // Capture browser console logs for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`[Browser Error] ${msg.text()}`);
      } else {
        console.log(`[Browser Console] ${msg.text()}`);
      }
    });

    console.log('[Test Log] Starting login test.');

    // 1. Navigate to the login page
    await page.goto('/login');
    console.log(`[Test Log] Navigated to URL: ${page.url()}`);

    // 2. Fill out the login form
    await page.getByLabel('Email address').fill('test@example.com');
    await page.getByLabel('Password').fill('test_password');
    console.log('[Test Log] Filled out login form.');

    // 3. Click the 'Sign in' button
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    console.log('[Test Log] Clicked "Sign in" button.');

    // 4. Wait for redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    console.log(`[Test Log] Redirected to URL: ${page.url()}`);

    // 5. Verify dashboard content is visible
    await expect(page.getByText('Welcome back!')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    console.log('[Test Log] Dashboard content is visible. Login test passed.');
  });
});
