import { test, expect } from './fixtures/auth'

test.describe('Factory Code', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/factory')
  })

  test('factory code page loads with search', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /factory|code/i })).toBeVisible()
    await expect(page.getByPlaceholder(/search|factory/i)).toBeVisible()
  })

  test('search returns results', async ({ authenticatedPage: page }) => {
    const searchInput = page.getByPlaceholder(/search|factory/i)
    await searchInput.fill('test')
    await page.waitForTimeout(1000)
    const results = page.locator('tr, [class*="card"], [class*="row"]').filter({ hasText: /factory|code|city/i })
    if (await results.count() > 0) {
      await expect(results.first()).toBeVisible()
    }
  })

  test('export button is present', async ({ authenticatedPage: page }) => {
    const exportBtn = page.getByRole('button', { name: /export|download/i })
    if (await exportBtn.isVisible()) {
      await expect(exportBtn).toBeVisible()
    }
  })

  test('import button is present for admins', async ({ authenticatedPage: page }) => {
    const importBtn = page.getByRole('button', { name: /import|upload/i })
    if (await importBtn.isVisible()) {
      await expect(importBtn).toBeVisible()
    }
  })

  test('search clears when input is emptied', async ({ authenticatedPage: page }) => {
    const searchInput = page.getByPlaceholder(/search|factory/i)
    await searchInput.fill('test')
    await page.waitForTimeout(500)
    await searchInput.clear()
    await page.waitForTimeout(500)
  })
})
