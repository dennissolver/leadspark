// stripeIntegration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Stripe Checkout Integration', () => {
  test('allows a user to start a subscription and be redirected to Stripe', async ({ page }) => {
    // Capture browser console logs for debugging
    page.on('console', msg => console.log(`[Browser Console] ${msg.text()}`));
    console.log('[Test Log] Starting Stripe integration test.');

    // Go to the main landing page first
    await page.goto('/leadspark-intro');
    console.log(`[Test Log] Navigated to URL: ${page.url()}`);

    // Click one of the "Start Your Leadspark Free Trial" buttons
    await page.getByRole('link', { name: /Start Your Leadspark Free Trial/i }).first().click();
    console.log('[Test Log] Clicked "Start Your Free Trial" link.');

    // Should navigate to signup page
    await page.waitForURL('**/signup**');
    console.log(`[Test Log] Redirected to URL: ${page.url()}`);

    const userEmail = `test+${Date.now()}@example.com`;
    const userPassword = 'SuperSecure!123';

    // Use actual form field names from signup.tsx
    await page.getByLabel('First name').fill('Test');
    await page.getByLabel('Last name').fill('User');
    await page.getByLabel('Company name').fill('Test Company');
    await page.getByLabel('Email address').fill(userEmail);
    await page.getByLabel('Password').fill(userPassword);
    console.log('[Test Log] Filled out signup form.');

    // Use actual button text from signup.tsx
    await page.getByRole('button', { name: 'Create account' }).click();
    console.log('[Test Log] Clicked "Create account" button.');

    // Wait for thank-you page (as per signup.tsx flow)
    await page.waitForURL('**/thank-you**', { timeout: 30000 });
    console.log(`[Test Log] Redirected to URL: ${page.url()}`);

    // Navigate to pricing page to test Stripe integration
    await page.goto('/pricing');
    console.log(`[Test Log] Navigated to URL: ${page.url()}`);

    // Look for subscription/pricing buttons
    await page.getByRole('button', { name: /subscribe|start.*trial|get.*pro/i }).first().click();
    console.log('[Test Log] Clicked a pricing button.');

    // Expect redirect to Stripe Checkout
    await page.waitForURL('**stripe.com/**', { timeout: 30000 });
    await expect(page).toHaveURL(/stripe\.com/);
    console.log('[Test Log] Successfully redirected to Stripe. Test passed.');
  });
});
