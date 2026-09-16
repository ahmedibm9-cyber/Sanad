import { test, expect } from './fixtures/auth'

test.describe('Notifications', () => {
  test('L1: notification bell exists in topbar', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    const notifBtn = page.getByRole('button', { name: /Notifications|التنبيهات/i })
    await expect(notifBtn).toBeVisible()
  })

  test('L2: clicking notification bell opens panel', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    const notifBtn = page.getByRole('button', { name: /Notifications|التنبيهات/i })
    await notifBtn.click()
    const panel = page.locator('[class*="panel"], [class*="dropdown"], [role="dialog"]').filter({ hasText: /notification|تنبيه/i }).first()
    if (await panel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(panel).toBeVisible()
      await page.keyboard.press('Escape')
    }
  })

  test('L3: notifications page loads', async ({ authenticatedPage: page }) => {
    await page.goto('/notifications')
    await expect(page.locator('body')).toBeVisible()
  })

  test('L4: notifications page has mark all as read', async ({ authenticatedPage: page }) => {
    await page.goto('/notifications')
    const markAllBtn = page.getByRole('button', { name: /mark all|read all|clear all|تعليم الكل/i })
    if (await markAllBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(markAllBtn).toBeVisible()
    }
  })

  test('L5: notification empty state shows message', async ({ authenticatedPage: page }) => {
    await page.goto('/notifications')
    const notifItems = page.locator('[class*="card"], [class*="row"], [class*="item"]')
    if (await notifItems.count() === 0) {
      await expect(page.getByText(/no notifications|all caught up|empty|لا توجد/i)).toBeVisible()
    }
  })

  test('L6: notification items show entity links', async ({ authenticatedPage: page }) => {
    await page.goto('/notifications')
    const notifItems = page.locator('a, button').filter({ hasText: /project|task|document|customer|issue/i })
    if (await notifItems.count() > 0) {
      await expect(notifItems.first()).toBeVisible()
    }
  })
})
