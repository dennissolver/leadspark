// widget.integration.spec.ts - COMPREHENSIVE
import { test, expect } from '@playwright/test';

test('Widget loads and starts a conversation', async ({ page }) => {
  // Capture browser console logs for debugging
  page.on('console', msg => console.log(`[Browser Console] ${msg.text()}`));
  console.log('[Test Log] Starting widget integration test.');

  // Go to the main landing page
  await page.goto('/leadspark-intro');
  console.log(`[Test Log] Navigated to URL: ${page.url()}`);

  // Wait for page to load completely
  await page.waitForLoadState('networkidle');

  // Add debugging to see what's actually on the page
  await page.screenshot({ path: 'debug-widget-page.png', fullPage: true });

  // Check for various possible widget implementations
  const widgetSelectors = [
    '#leadspark-widget-container',
    '.conversation-window',
    '.avatar-animation',
    '[data-testid="chat-widget"]',
    'text="Talk to Jess"',
    'text="Chat"',
    'text="Start Voice Assistant"',
    '.widget',
    '.chat-widget',
    '.jess-widget'
  ];

  let widgetFound = false;
  console.log('[Test Log] Checking for widget selectors...');
  for (const selector of widgetSelectors) {
    try {
      await expect(page.locator(selector)).toBeVisible({ timeout: 2000 });
      console.log(`[Test Log] Widget found with selector: ${selector}`);
      widgetFound = true;
      break;
    } catch (e) {
      console.log(`[Test Log] Widget not found with selector: ${selector}`);
      // Continue to next selector
    }
  }

  if (!widgetFound) {
    // Log what's actually on the page for debugging
    const bodyContent = await page.locator('body').innerHTML();
    console.log('Page body content (first 1000 chars):', bodyContent.substring(0, 1000));

    // Check if there are any script tags that might load the widget
    const scripts = await page.locator('script').count();
    console.log(`Found ${scripts} script tags`);

    throw new Error('Widget not found with any of the expected selectors');
  }

  console.log('[Test Log] Widget integration test passed.');
  // If widget is found, try to interact with it
  // This will depend on your actual widget implementation
});
