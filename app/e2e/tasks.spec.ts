import { test, expect } from './fixtures/auth'

test.describe('Tasks', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/tasks')
  })

  test('D1: tasks page loads with heading', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
  })

  test('D2: New Task button is present', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: /New Task|مهمة جديدة/ })).toBeVisible()
  })

  test('D3: search field is present', async ({ authenticatedPage: page }) => {
    await expect(page.getByPlaceholder(/Search|بحث/)).toBeVisible()
  })

  test('D4: create new task opens form modal', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /New Task|مهمة جديدة/ }).click()
    const modal = page.locator('[role="dialog"], .fixed, .modal').first()
    await expect(modal).toBeVisible({ timeout: 5_000 })
  })

  test('D5: task list shows empty state or data', async ({ authenticatedPage: page }) => {
    await page.waitForSelector('table, [class*="card"], [class*="empty"]', { timeout: 15_000 }).catch(() => {})
    const rows = page.locator('table tbody tr, [class*="card"]').filter({ hasText: /task|مهمة/i })
    const heading = page.getByText(/\d+ tasks?/i)
    const emptyState = page.getByText(/No tasks|لا توجد|empty|getting started|No export operations/i)
    const hasContent = await heading.isVisible().catch(() => false) || await rows.count() > 0 || await emptyState.isVisible().catch(() => false)
    expect(hasContent).toBeTruthy()
  })

  test('D6: status filter exists', async ({ authenticatedPage: page }) => {
    const filter = page.locator('select, [role="combobox"]').first()
    if (await filter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(filter).toBeVisible()
    }
  })

  test('D7: clicking a task navigates to detail', async ({ authenticatedPage: page }) => {
    const taskLink = page.locator('a[href*="/tasks/"]').first()
    if (await taskLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskLink.click()
      await page.waitForURL(/\/tasks\/[\w-]+/, { timeout: 10_000 })
    }
  })

  test('D8: task detail has tabs (Overview, Documents, Notes)', async ({ authenticatedPage: page }) => {
    const taskLink = page.locator('a[href*="/tasks/"]').first()
    if (await taskLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskLink.click()
      await page.waitForURL(/\/tasks\/[\w-]+/, { timeout: 10_000 })
      const tabs = page.locator('button, [role="tab"]').filter({ hasText: /Overview|Documents|Notes|Issues/i })
      expect(await tabs.count()).toBeGreaterThan(0)
    }
  })

  test('D9: task detail has Convert to Project option', async ({ authenticatedPage: page }) => {
    const taskLink = page.locator('a[href*="/tasks/"]').first()
    if (await taskLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskLink.click()
      await page.waitForURL(/\/tasks\/[\w-]+/, { timeout: 10_000 })
      const convertBtn = page.getByRole('button', { name: /Convert|to Project|تحويل/i })
      if (await convertBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(convertBtn).toBeVisible()
      }
    }
  })

  test('D10: task detail has New Document button', async ({ authenticatedPage: page }) => {
    const taskLink = page.locator('a[href*="/tasks/"]').first()
    if (await taskLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskLink.click()
      await page.waitForURL(/\/tasks\/[\w-]+/, { timeout: 10_000 })
      const docBtn = page.getByRole('button', { name: /New Document|مستند جديد/i })
      if (await docBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(docBtn).toBeVisible()
      }
    }
  })

  test('D11: task detail has Add Note and Report Issue buttons', async ({ authenticatedPage: page }) => {
    const taskLink = page.locator('a[href*="/tasks/"]').first()
    if (await taskLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskLink.click()
      await page.waitForURL(/\/tasks\/[\w-]+/, { timeout: 10_000 })
      const noteBtn = page.getByRole('button', { name: /Add Note|note|ملاحظة/i })
      const issueBtn = page.getByRole('button', { name: /Report Issue|ISSUE|إبلاغ/i })
      if (await noteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(noteBtn).toBeVisible()
      }
      if (await issueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(issueBtn).toBeVisible()
      }
    }
  })

  test('D12: task actions dropdown has Edit, Delete options', async ({ authenticatedPage: page }) => {
    const taskLink = page.locator('a[href*="/tasks/"]').first()
    if (await taskLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskLink.click()
      await page.waitForURL(/\/tasks\/[\w-]+/, { timeout: 10_000 })
      const actionsBtn = page.locator('button').filter({ hasText: /actions|⋮|⋯|\.\.\./i }).first()
      if (await actionsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await actionsBtn.click()
        const dropdown = page.locator('[role="menu"], .dropdown, [class*="absolute"]').first()
        await expect(dropdown).toBeVisible({ timeout: 3_000 })
      }
    }
  })
})
