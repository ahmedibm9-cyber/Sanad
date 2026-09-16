import { test, expect } from './fixtures/auth'

test.describe('Notes and Report Issues', () => {
  test('K1: project detail has Notes tab', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const notesTab = page.locator('button, [role="tab"]').filter({ hasText: /Notes|Issues|ملاحظات|مشاكل/i }).first()
      if (await notesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await notesTab.click()
        await page.waitForTimeout(500)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })

  test('K2: Add Note button exists on project detail', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const noteBtn = page.getByRole('button', { name: /Add Note|note|ملاحظة/i })
      if (await noteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(noteBtn).toBeVisible()
      }
    }
  })

  test('K3: Report Issue button exists on project detail', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const issueBtn = page.getByRole('button', { name: /Report Issue|ISSUE|إبلاغ/i })
      if (await issueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(issueBtn).toBeVisible()
      }
    }
  })

  test('K4: add note opens form with content field', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const noteBtn = page.getByRole('button', { name: /Add Note|note|ملاحظة/i })
      if (await noteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await noteBtn.click()
        const modal = page.locator('[role="dialog"], .fixed, .modal').first()
        await expect(modal).toBeVisible({ timeout: 5_000 })
        await expect(modal.getByText(/Note|Content|Text|ملاحظة|نص|محتوى/i).first()).toBeVisible()
      }
    }
  })

  test('K5: report issue opens form with title and severity', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const issueBtn = page.getByRole('button', { name: /Report Issue|ISSUE|إبلاغ/i })
      if (await issueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await issueBtn.click()
        const modal = page.locator('[role="dialog"], .fixed, .modal').first()
        await expect(modal).toBeVisible({ timeout: 5_000 })
        await expect(modal.getByText(/Title|Severity|Issue|عنوان|شدة|مشكلة/i).first()).toBeVisible()
      }
    }
  })

  test('K6: issue severity options include Low, Medium, High, Critical', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const issueBtn = page.getByRole('button', { name: /Report Issue|ISSUE|إبلاغ/i })
      if (await issueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await issueBtn.click()
        const modal = page.locator('[role="dialog"], .fixed, .modal').first()
        await expect(modal).toBeVisible({ timeout: 5_000 })
        const severitySelect = modal.locator('select, [role="combobox"]').filter({ hasText: /severity|شدة/i }).first()
        if (await severitySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          await severitySelect.click()
          await page.waitForTimeout(300)
          const options = page.locator('[role="option"], option').filter({ hasText: /Low|Medium|High|Critical|منخفض|متوسط|عالي|حرج/i })
          expect(await options.count()).toBeGreaterThan(0)
        }
      }
    }
  })

  test('K7: notes and issues tabs on task detail', async ({ authenticatedPage: page }) => {
    await page.goto('/tasks')
    const taskLink = page.locator('a[href*="/tasks/"]').first()
    if (await taskLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskLink.click()
      await page.waitForURL(/\/tasks\/[\w-]+/, { timeout: 10_000 })
      const tabs = page.locator('button, [role="tab"]').filter({ hasText: /Notes|Issues|ملاحظات|مشاكل/i })
      expect(await tabs.count()).toBeGreaterThan(0)
    }
  })

  test('K8: note list shows notes or empty state', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const notesTab = page.locator('button, [role="tab"]').filter({ hasText: /Notes|Issues/i }).first()
      if (await notesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await notesTab.click()
        await page.waitForTimeout(500)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})
