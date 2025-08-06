import { test, expect } from '@playwright/test';

test('Widget loads and starts a conversation', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('text=Talk to Jess');
  await expect(page.locator('.conversation-ui')).toBeVisible();
});
