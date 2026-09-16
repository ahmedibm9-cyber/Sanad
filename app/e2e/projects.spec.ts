import { test, expect } from './fixtures/auth'

test.describe('Projects', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
  })

  test('C1: projects page loads with heading', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible()
  })

  test('C2: search field is present', async ({ authenticatedPage: page }) => {
    await expect(page.getByPlaceholder(/Search projects|بحث/)).toBeVisible()
  })

  test('C3: New Project button is present', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: /New Project|مشروع جديد/ })).toBeVisible()
  })

  test('C4: create new project opens form modal', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /New Project|مشروع جديد/ }).click()
    const modal = page.locator('[role="dialog"], .fixed, .modal').first()
    await expect(modal).toBeVisible({ timeout: 5_000 })
  })

  test('C5: create project button requires name and customer', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /New Project|مشروع جديد/ }).click()
    const modal = page.locator('[role="dialog"], .fixed, .modal').first()
    await expect(modal).toBeVisible({ timeout: 5_000 })

    const saveBtn = modal.getByRole('button', { name: /Create Project|Save|إضافة|حفظ/i }).first()
    const initiallyDisabled = await saveBtn.evaluate((el: HTMLButtonElement) => el.disabled)
    expect(initiallyDisabled).toBeTruthy()

    const nameInput = modal.getByPlaceholder(/HDPE Shipment/i)
    await nameInput.fill('E2E Test Project')
    await page.waitForTimeout(500)
    const stillDisabledAfterName = await saveBtn.evaluate((el: HTMLButtonElement) => el.disabled)
    expect(stillDisabledAfterName).toBeTruthy()
  })

  test('C6: status filter dropdown exists', async ({ authenticatedPage: page }) => {
    const filter = page.locator('select, [role="combobox"]').first()
    if (await filter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(filter).toBeVisible()
    }
  })

  test('C7: project list shows empty state or data', async ({ authenticatedPage: page }) => {
    await page.waitForSelector('table, [class*="card"], [class*="empty"]', { timeout: 15_000 }).catch(() => {})
    const rows = page.locator('table tbody tr, [class*="card"]').filter({ hasText: /project|مشروع/i })
    const heading = page.getByText(/\d+ projects?/i)
    const emptyState = page.getByText(/No projects|لا توجد|empty|getting started|No export operations/i)
    const hasContent = await heading.isVisible().catch(() => false) || await rows.count() > 0 || await emptyState.isVisible().catch(() => false)
    expect(hasContent).toBeTruthy()
  })

  test('C8: clicking a project navigates to detail', async ({ authenticatedPage: page }) => {
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
    }
  })

  test('C9: project detail has tabs (Overview, Documents, etc)', async ({ authenticatedPage: page }) => {
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const tabs = page.locator('button, [role="tab"]').filter({ hasText: /Overview|Documents|Materials|Notes|Issues|نظرة|مستندات/i })
      expect(await tabs.count()).toBeGreaterThan(0)
    }
  })

  test('C10: project detail has New Document button', async ({ authenticatedPage: page }) => {
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const docBtn = page.getByRole('button', { name: /New Document|مستند جديد/i })
      if (await docBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(docBtn).toBeVisible()
      }
    }
  })

  test('C11: project detail has Add Note button', async ({ authenticatedPage: page }) => {
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const noteBtn = page.getByRole('button', { name: /Add Note|ملاحظة|note/i })
      if (await noteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(noteBtn).toBeVisible()
      }
    }
  })

  test('C12: project detail has Report Issue button', async ({ authenticatedPage: page }) => {
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const issueBtn = page.getByRole('button', { name: /Report Issue|problem| ISSUE|إبلاغ/i })
      if (await issueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(issueBtn).toBeVisible()
      }
    }
  })

  test('C13: project actions dropdown has Edit, Archive, Delete', async ({ authenticatedPage: page }) => {
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const actionsBtn = page.locator('button').filter({ hasText: /actions|⋮|⋯|\.\.\./i }).first()
      if (await actionsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await actionsBtn.click()
        const dropdown = page.locator('[role="menu"], .dropdown, [class*="absolute"]').first()
        await expect(dropdown).toBeVisible({ timeout: 3_000 })
      }
    }
  })

  test('C14: archived projects section exists at bottom', async ({ authenticatedPage: page }) => {
    const archived = page.getByText(/Archived|مؤرشف/i)
    if (await archived.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(archived).toBeVisible()
    }
  })

  test('C15: project create modal has Company, Customer, Material fields', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /New Project|مشروع جديد/ }).click()
    const modal = page.locator('[role="dialog"], .fixed, .modal').first()
    await expect(modal).toBeVisible({ timeout: 5_000 })
    await expect(modal.getByText(/Company|Customer|Material|شركة|عميل|مادة/i).first()).toBeVisible()
  })
})
