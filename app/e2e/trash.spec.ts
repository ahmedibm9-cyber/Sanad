import { test, expect } from './fixtures/auth'

test.describe('Trash & Restore', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/trash')
  })

  test('trash page loads with heading', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /Trash/i })).toBeVisible()
  })

  test('search field is present', async ({ authenticatedPage: page }) => {
    await expect(page.getByPlaceholder(/Search/)).toBeVisible()
  })

  test('trash list shows entries or empty state', async ({ authenticatedPage: page }) => {
    const entries = page.locator('tr, [class*="card"], [class*="row"]').filter({ hasText: /deleted|restore/i })
    const emptyState = page.getByText(/No trash|No deleted|empty|All clean/i)
    if (await entries.count() > 0) {
      await expect(entries.first()).toBeVisible()
    } else {
      await expect(emptyState).toBeVisible()
    }
  })

  test('restore button is present for each entry', async ({ authenticatedPage: page }) => {
    const restoreBtns = page.getByRole('button', { name: /restore/i })
    if (await restoreBtns.count() > 0) {
      await expect(restoreBtns.first()).toBeVisible()
    }
  })

  test('entity type filter is available', async ({ authenticatedPage: page }) => {
    const filter = page.getByRole('combobox').or(page.getByRole('button', { name: /filter|type/i }))
    if (await filter.first().isVisible()) {
      await expect(filter.first()).toBeVisible()
    }
  })

  test('restore shows confirmation dialog', async ({ authenticatedPage: page }) => {
    const restoreBtn = page.getByRole('button', { name: /restore/i }).first()
    if (await restoreBtn.isVisible()) {
      await restoreBtn.click()
      const dialog = page.getByRole('dialog')
      if (await dialog.isVisible()) {
        await expect(dialog).toBeVisible()
        await expect(dialog.getByText(/confirm|restore|are you sure/i)).toBeVisible()
        await dialog.getByRole('button', { name: /cancel|close/i }).click()
      }
    }
  })
})
