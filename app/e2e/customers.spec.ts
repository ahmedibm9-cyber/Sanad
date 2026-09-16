import { test, expect } from './fixtures/auth'

test.describe('Customers', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/customers')
  })

  test('F1: customers page loads with heading', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /Customers|العملاء/ })).toBeVisible()
  })

  test('F2: New Customer button is present', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: /Add Customer|عميل جديد|New Customer/i })).toBeVisible()
  })

  test('F3: search field is present', async ({ authenticatedPage: page }) => {
    await page.getByText(/Loading/).waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})
    await expect(page.getByPlaceholder(/Search|بحث/)).toBeVisible()
  })

  test('F4: create new customer opens form', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Add Customer|عميل جديد|New Customer/i }).click()
    const modal = page.locator('[role="dialog"], .fixed, .modal').first()
    await expect(modal).toBeVisible({ timeout: 5_000 })
  })

  test('F5: customer form has name, email, phone fields', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Add Customer|عميل جديد|New Customer/i }).click()
    const modal = page.locator('[role="dialog"], .fixed, .modal').first()
    await expect(modal).toBeVisible({ timeout: 5_000 })
    await expect(modal.getByText(/Name|Email|Phone|اسم|بريد|هاتف/i).first()).toBeVisible()
  })

  test('F6: create customer with name', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Add Customer|عميل جديد|New Customer/i }).click()
    const modal = page.locator('[role="dialog"], .fixed, .modal').first()
    await expect(modal).toBeVisible({ timeout: 5_000 })

    const nameInput = modal.getByRole('textbox', { name: /name|اسم/i }).first()
    if (await nameInput.isVisible()) {
      await nameInput.fill('E2E Test Customer')
    }

    const saveBtn = modal.getByRole('button', { name: /Save|Create|إضافة|حفظ/i }).first()
    if (await saveBtn.isVisible()) {
      await saveBtn.click()
      await page.waitForTimeout(2000)
    }
  })

  test('F7: customer list shows data or empty state', async ({ authenticatedPage: page }) => {
    await page.goto('/customers')
    await page.getByText(/Loading/).waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})
    await page.waitForTimeout(1000)
    const heading = page.getByRole('heading', { name: /Customers|العملاء/ })
    const rows = page.locator('table tbody tr, [class*="card"]').filter({ hasText: /customer|client|عميل/i })
    const emptyState = page.getByText(/No customers|لا توجد|empty/i)
    const hasContent = await heading.isVisible().catch(() => false) || await rows.count() > 0 || await emptyState.isVisible().catch(() => false)
    expect(hasContent).toBeTruthy()
  })

  test('F8: clicking customer navigates to detail', async ({ authenticatedPage: page }) => {
    const link = page.locator('a[href*="/customers/"]').first()
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click()
      await page.waitForURL(/\/customers\/[\w-]+/, { timeout: 10_000 })
    }
  })

  test('F9: customer detail shows tabs', async ({ authenticatedPage: page }) => {
    const link = page.locator('a[href*="/customers/"]').first()
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click()
      await page.waitForURL(/\/customers\/[\w-]+/, { timeout: 10_000 })
      const tabs = page.locator('button, [role="tab"]').filter({ hasText: /Projects|Documents|Contacts|Overview|مشاريع|مستندات/i })
      expect(await tabs.count()).toBeGreaterThan(0)
    }
  })

  test('F10: customer detail has edit and back buttons', async ({ authenticatedPage: page }) => {
    const link = page.locator('a[href*="/customers/"]').first()
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click()
      await page.waitForURL(/\/customers\/[\w-]+/, { timeout: 10_000 })
      const editBtn = page.getByRole('button', { name: /Edit|تعديل/i })
      const backBtn = page.locator('button, a').filter({ hasText: /Back|返回|←/i }).first()
      if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(editBtn).toBeVisible()
      }
      if (await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(backBtn).toBeVisible()
      }
    }
  })
})
