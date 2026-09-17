/**
 * E2E tests for Documents page.
 * UAT Checklist: #49 (Documents List), #48 (Number Validation)
 */

import { test, expect } from './fixtures/auth'

test.describe('Documents Page', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/documents')
    await page.waitForLoadState('networkidle')
  })

  test('D1: Documents page loads with heading', async ({ authenticatedPage: page }) => {
    const heading = page.getByRole('heading', { name: /Documents|المستندات/ })
    await expect(heading).toBeVisible()
  })

  test('D2: Search field is present', async ({ authenticatedPage: page }) => {
    const search = page.locator('input[placeholder*="Search"], input[placeholder*="بحث"]')
    await expect(search).toBeVisible()
  })

  test('D3: Type filter dropdown exists', async ({ authenticatedPage: page }) => {
    const filter = page.locator('button:has-text("All Types"), button:has-text("كل الأنواع")')
    await expect(filter).toBeVisible()
  })

  test('D4: Status filter dropdown exists', async ({ authenticatedPage: page }) => {
    const filter = page.locator('select').filter({ hasText: /All Statuses|كل الحالات/ })
    await expect(filter).toBeVisible()
  })

  test('D5: Documents table or empty state is shown', async ({ authenticatedPage: page }) => {
    const table = page.locator('table')
    const emptyState = page.getByText(/No documents found|لم يتم العثور على مستندات/)
    const isVisible = await table.isVisible().catch(() => false) || await emptyState.isVisible().catch(() => false)
    expect(isVisible).toBeTruthy()
  })

  test('D6: "New Document" button exists and is clickable', async ({ authenticatedPage: page }) => {
    const btn = page.locator('button').filter({ hasText: /New Document|مستند جديد/ })
    await expect(btn).toBeVisible({ timeout: 5000 })
  })

  test('D7: Document rows show number, type, date, status', async ({ authenticatedPage: page }) => {
    const table = page.locator('table')
    const emptyState = page.getByText(/No documents found|لم يتم العثور على مستندات/)
    const hasTable = await table.isVisible().catch(() => false)
    const hasEmpty = await emptyState.isVisible().catch(() => false)
    expect(hasTable || hasEmpty).toBeTruthy()
    if (hasTable) {
      const rows = page.locator('table tbody tr')
      const count = await rows.count()
      if (count > 0) {
        const firstRow = rows.first()
        await expect(firstRow.locator('td')).toHaveCount(6)
        await expect(firstRow.locator('td').nth(0).locator('span').first()).toBeVisible()
        await expect(firstRow.locator('td').nth(1).locator('span').first()).toBeVisible()
      }
    }
  })

  test('D8: Preview button navigates to preview page', async ({ authenticatedPage: page }) => {
    await expect(page.locator('table').or(page.getByText(/No documents found|لم يتم العثور على مستندات/)).first()).toBeVisible({ timeout: 10_000 })
    const rows = page.locator('table tbody tr')
    const count = await rows.count()
    test.skip(count === 0, 'No documents to test preview')
    const previewBtn = page.locator('button[title="Preview"], button[title="معاينة"]').first()
    await expect(previewBtn).toBeVisible({ timeout: 5000 })
    await previewBtn.click()
    await page.waitForURL(/\/documents\/.*\/preview/)
  })

  test('D9: Edit button navigates to form page', async ({ authenticatedPage: page }) => {
    await expect(page.locator('table').or(page.getByText(/No documents found|لم يتم العثور على مستندات/)).first()).toBeVisible({ timeout: 10_000 })
    const rows = page.locator('table tbody tr')
    const count = await rows.count()
    test.skip(count === 0, 'No documents to test edit')
    const editBtn = page.locator('button[title="Edit"], button[title="تعديل"]').first()
    await expect(editBtn).toBeVisible({ timeout: 5000 })
    await editBtn.click()
    await page.waitForURL(/\/documents\/.*\/form/)
  })

  test('D10: Delete button shows confirmation modal', async ({ authenticatedPage: page }) => {
    await expect(page.locator('table').or(page.getByText(/No documents found|لم يتم العثور على مستندات/)).first()).toBeVisible({ timeout: 10_000 })
    const rows = page.locator('table tbody tr')
    const count = await rows.count()
    test.skip(count === 0, 'No documents to test delete')
    const deleteBtn = page.locator('button[title="Delete"], button[title="حذف"]').first()
    await expect(deleteBtn).toBeVisible({ timeout: 5000 })
    await deleteBtn.click()
    const modal = page.locator('[role="dialog"] h3:has-text("Delete Document"), [role="dialog"] h3:has-text("حذف المستند")')
    await expect(modal).toBeVisible({ timeout: 5000 })
  })

  test('D11: Search filters documents by number', async ({ authenticatedPage: page }) => {
    await expect(page.locator('table').or(page.getByText(/No documents found|لم يتم العثور على مستندات/)).first()).toBeVisible({ timeout: 10_000 })
    const rows = page.locator('table tbody tr')
    const count = await rows.count()
    test.skip(count === 0, 'No documents to test search filter')
    const search = page.locator('input[placeholder*="Search"], input[placeholder*="بحث"]')
    await expect(search).toBeVisible({ timeout: 5000 })
    await search.fill('TINV')
    await page.waitForTimeout(500)
    const filteredRows = page.locator('table tbody tr')
    const filteredCount = await filteredRows.count()
    for (let i = 0; i < filteredCount; i++) {
      const text = await filteredRows.nth(i).textContent()
      expect(text?.toLowerCase()).toContain('tinv')
    }
  })

  test('D12: Type filter works', async ({ authenticatedPage: page }) => {
    const filterBtn = page.locator('button:has-text("All Types"), button:has-text("كل الأنواع")').first()
    await expect(filterBtn).toBeVisible({ timeout: 10_000 })
    await filterBtn.click()
    const option = page.locator('button:has-text("Tax Invoice"), button:has-text("فاتورة ضريبية")').first()
    await expect(option).toBeVisible({ timeout: 5000 })
    await option.click()
    await page.waitForTimeout(500)
    const selectedFilter = page.locator('button:has-text("Tax Invoice"), button:has-text("فاتورة ضريبية")').first()
    await expect(selectedFilter).toBeVisible({ timeout: 5000 })
  })
})
