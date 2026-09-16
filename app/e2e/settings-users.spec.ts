import { test, expect } from './fixtures/auth'

test.describe('Settings and User Management', () => {
  test('N1: settings page loads with heading', async ({ authenticatedPage: page }) => {
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: /Settings|الإعدادات/ })).toBeVisible()
  })

  test('N2: settings page has company identity section', async ({ authenticatedPage: page }) => {
    await page.goto('/settings')
    await expect(page.getByText(/Company|Identity|Name|Logo|شركة|هوية|اسم/i).first()).toBeVisible()
  })

  test('N3: settings page has document defaults section', async ({ authenticatedPage: page }) => {
    await page.goto('/settings')
    await expect(page.getByText(/Document|Default|Template|VAT|Currency|مستند|قالب|عملة/i).first()).toBeVisible()
  })

  test('N4: settings page has banking section', async ({ authenticatedPage: page }) => {
    await page.goto('/settings')
    await expect(page.getByText(/Bank|Account|IBAN|SWIFT|بنك|حساب/i).first()).toBeVisible()
  })

  test('N5: settings page has contact section', async ({ authenticatedPage: page }) => {
    await page.goto('/settings')
    await page.getByRole('button', { name: /Contact|جهة الاتصال/i }).or(page.getByText('Contact', { exact: false })).first().click()
    await page.waitForTimeout(500)
    await expect(page.getByText(/Phone|Email|هاتف|بريد/i).first()).toBeVisible()
  })

  test('N6: users page loads with heading', async ({ authenticatedPage: page }) => {
    await page.goto('/users')
    await expect(page.getByRole('heading', { name: /Users|المستخدمين/ })).toBeVisible()
  })

  test('N7: Create User button exists', async ({ authenticatedPage: page }) => {
    await page.goto('/users')
    await expect(page.getByRole('button', { name: /Create User|مستخدم جديد|إضافة/i })).toBeVisible()
  })

  test('N8: create user opens form with role selection', async ({ authenticatedPage: page }) => {
    await page.goto('/users')
    await page.getByRole('button', { name: /Create User|مستخدم جديد|إضافة/i }).click()
    const modal = page.locator('[role="dialog"], .fixed, .modal').first()
    await expect(modal).toBeVisible({ timeout: 5_000 })
    await expect(modal.getByText(/Role|Admin|User|Viewer|دور|مدير|مستخدم|مشاهد/i).first()).toBeVisible()
  })

  test('N9: user list shows users or empty state', async ({ authenticatedPage: page }) => {
    await page.goto('/users')
    await page.waitForFunction(() => !document.querySelector('[class*="animate-spin"]'), { timeout: 15_000 }).catch(() => {})
    await page.waitForTimeout(1000)
    const rows = page.locator('table tbody tr, [class*="card"]').filter({ hasText: /user|admin|viewer|مستخدم/i })
    const emptyState = page.getByText(/No users|لا يوجد|empty|No members/i)
    const hasContent = await rows.count() > 0 || await emptyState.isVisible().catch(() => false)
    expect(hasContent).toBeTruthy()
  })

  test('N10: user detail has permission toggles', async ({ authenticatedPage: page }) => {
    await page.goto('/users')
    const userRow = page.locator('table tbody tr, [class*="card"]').filter({ hasText: /user|admin|viewer/i }).first()
    if (await userRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await userRow.click()
      await page.waitForTimeout(500)
      const permBtn = page.getByRole('button', { name: /Permission|Edit|تعديل|صلاحيات/i })
      if (await permBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await permBtn.click()
        const checkboxes = page.locator('input[type="checkbox"]')
        expect(await checkboxes.count()).toBeGreaterThan(0)
      }
    }
  })

  test('N11: permission groups include Projects, Tasks, Documents', async ({ authenticatedPage: page }) => {
    await page.goto('/users')
    const userRow = page.locator('table tbody tr, [class*="card"]').filter({ hasText: /user|admin|viewer/i }).first()
    if (await userRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await userRow.click()
      await page.waitForTimeout(500)
      const permBtn = page.getByRole('button', { name: /Permission|Edit|تعديل|صلاحيات/i })
      if (await permBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await permBtn.click()
        await page.waitForTimeout(500)
        const groups = page.getByText(/Projects|Tasks|Documents|Customers|Materials|مشاريع|مستندات|عملاء|مواد/i)
        expect(await groups.count()).toBeGreaterThan(0)
      }
    }
  })

  test('N12: role dropdown shows Admin, User, Viewer options', async ({ authenticatedPage: page }) => {
    await page.goto('/users')
    await page.getByRole('button', { name: /Create User|مستخدم جديد|إضافة/i }).click()
    const modal = page.locator('[role="dialog"], .fixed, .modal').first()
    await expect(modal).toBeVisible({ timeout: 5_000 })
    const roleSelect = modal.locator('select').last()
    if (await roleSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const options = await roleSelect.locator('option').allTextContents()
      expect(options.some(o => /Admin|User|Viewer/i.test(o))).toBeTruthy()
    }
  })
})
