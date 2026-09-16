import { test, expect } from '@playwright/test';

test('should work', async ({ page }) => {
  await page.goto('https://example.com');
  expect(await page.title()).toBe('Example Domain');
});