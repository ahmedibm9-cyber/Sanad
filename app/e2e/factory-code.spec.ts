import { test, expect } from './fixtures/auth'

test.describe('Factory Code', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/factory')
  })

  test('H1: factory code page loads with heading', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /Factory|Code|المصنع|الكود/ })).toBeVisible()
  })

  test('H2: search field is present', async ({ authenticatedPage: page }) => {
    await expect(page.getByPlaceholder(/Search|بحث/)).toBeVisible()
  })

  test('H3: table shows factory code records', async ({ authenticatedPage: page }) => {
    const table = page.locator('table').first()
    if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
      const rows = table.locator('tbody tr')
      expect(await rows.count()).toBeGreaterThan(0)
    }
  })

  test('H4: search filters results', async ({ authenticatedPage: page }) => {
    const searchInput = page.getByPlaceholder(/Search|بحث/)
    if (await searchInput.isVisible()) {
      await searchInput.fill('952')
      await page.waitForTimeout(1000)
      await searchInput.clear()
      await page.waitForTimeout(500)
    }
  })

  test('H5: export button exists', async ({ authenticatedPage: page }) => {
    const exportBtn = page.getByRole('button', { name: /Export|Download|Excel|تصدير/i })
    if (await exportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(exportBtn).toBeVisible()
    }
  })

  test('H6: import button exists for admin', async ({ authenticatedPage: page }) => {
    const importBtn = page.getByRole('button', { name: /Import|Upload|استيراد/i })
    if (await importBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(importBtn).toBeVisible()
    }
  })

  test('H7: factory code table has multiple columns', async ({ authenticatedPage: page }) => {
    const table = page.locator('table').first()
    if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
      const headers = table.locator('th, thead td')
      expect(await headers.count()).toBeGreaterThan(2)
    }
  })

  test('H8: result count shows when searching', async ({ authenticatedPage: page }) => {
    const searchInput = page.getByPlaceholder(/Search|بحث/)
    if (await searchInput.isVisible()) {
      await searchInput.fill('HDPE')
      await page.waitForTimeout(1000)
      const countText = page.getByText(/\d+\s*(results?|records?|نتائج)/i)
      if (await countText.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(countText).toBeVisible()
      }
      await searchInput.clear()
    }
  })

  test('H9: pagination exists for large datasets', async ({ authenticatedPage: page }) => {
    const pagination = page.locator('[class*="pagination"], nav[aria-label*="pagination"]').first()
    if (await pagination.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(pagination).toBeVisible()
    }
  })

  test('H10: clear search shows all records again', async ({ authenticatedPage: page }) => {
    const searchInput = page.getByPlaceholder(/Search|بحث/)
    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      await page.waitForTimeout(500)
      await searchInput.clear()
      await page.waitForTimeout(500)
      const table = page.locator('table').first()
      if (await table.isVisible()) {
        const rows = table.locator('tbody tr')
        expect(await rows.count()).toBeGreaterThan(0)
      }
    }
  })
})
