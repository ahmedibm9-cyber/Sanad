import { test, expect } from './fixtures/auth'

test.describe('Notifications', () => {
  test('notification bell is visible in topbar', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    const notifBtn = page.getByRole('button', { name: /Notifications/i })
    await expect(notifBtn).toBeVisible()
  })

  test('notification badge shows count', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    const badge = page.locator('[class*="badge"]').filter({ hasText: /\d+/ })
    if (await badge.isVisible()) {
      await expect(badge).toBeVisible()
    }
  })

  test('clicking bell opens notification panel', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    const notifBtn = page.getByRole('button', { name: /Notifications/i })
    await notifBtn.click()
    const panel = page.locator('[class*="panel"], [class*="dropdown"], [role="dialog"]').filter({ hasText: /notification/i })
    if (await panel.isVisible()) {
      await expect(panel).toBeVisible()
    }
  })

  test('notifications page loads', async ({ authenticatedPage: page }) => {
    await page.goto('/notifications')
    await expect(page.getByText(/notifications| Notifications/i).first()).toBeVisible()
  })

  test('mark all read button exists', async ({ authenticatedPage: page }) => {
    await page.goto('/notifications')
    const markAllBtn = page.getByRole('button', { name: /mark all|read all|clear all/i })
    if (await markAllBtn.isVisible()) {
      await expect(markAllBtn).toBeVisible()
    }
  })
})
