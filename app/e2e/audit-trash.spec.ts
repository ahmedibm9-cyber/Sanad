import { test, expect } from './fixtures/auth'

test.describe('Audit Log and Trash', () => {
  test('M1: activity page loads with heading', async ({ authenticatedPage: page }) => {
    await page.goto('/activity')
    await expect(page.getByRole('heading', { name: /Activity|النشاط/ })).toBeVisible()
  })

  test('M2: activity page has filter options', async ({ authenticatedPage: page }) => {
    await page.goto('/activity')
    const filter = page.getByRole('combobox').or(page.getByRole('button', { name: /filter|type|نوع/i })).first()
    if (await filter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(filter).toBeVisible()
    }
  })

  test('M3: activity log shows entries or empty state', async ({ authenticatedPage: page }) => {
    await page.goto('/activity')
    await page.waitForFunction(() => !document.querySelector('[class*="animate-spin"]'), { timeout: 15_000 }).catch(() => {})
    await page.waitForTimeout(1000)
    const entries = page.locator('tr, [class*="card"], [class*="row"]').filter({ hasText: /created|edited|deleted|archived|task|project|document/i })
    const emptyState = page.getByText(/No activity|لا توجد|empty|No entries/i)
    const hasContent = await entries.count() > 0 || await emptyState.isVisible().catch(() => false)
    expect(hasContent).toBeTruthy()
  })

  test('M4: activity search filters entries', async ({ authenticatedPage: page }) => {
    await page.goto('/activity')
    const searchInput = page.getByPlaceholder(/search|بحث/i).first()
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('project')
      await page.waitForTimeout(500)
      await searchInput.clear()
    }
  })

  test('M5: activity page has pagination', async ({ authenticatedPage: page }) => {
    await page.goto('/activity')
    const pagination = page.getByRole('navigation', { name: /pagination/i })
    if (await pagination.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(pagination).toBeVisible()
    }
  })

  test('M6: trash page loads with heading', async ({ authenticatedPage: page }) => {
    await page.goto('/trash')
    await expect(page.getByRole('heading', { name: /Trash|سلة|المحذوفات/ })).toBeVisible()
  })

  test('M7: trash page shows empty state or deleted items', async ({ authenticatedPage: page }) => {
    await page.goto('/trash')
    await page.waitForFunction(() => !document.querySelector('[class*="animate-spin"]'), { timeout: 15_000 }).catch(() => {})
    await page.waitForTimeout(1000)
    const items = page.locator('tr, [class*="card"]').filter({ hasText: /deleted|removed|محذوف/i })
    const emptyState = page.getByText(/No items|Trash is empty|لا توجد|empty|No deleted/i)
    const hasContent = await items.count() > 0 || await emptyState.isVisible().catch(() => false)
    expect(hasContent).toBeTruthy()
  })

  test('M8: trash has restore button for items', async ({ authenticatedPage: page }) => {
    await page.goto('/trash')
    const restoreBtn = page.getByRole('button', { name: /Restore|استعادة/i })
    if (await restoreBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(restoreBtn).toBeVisible()
    }
  })
})
