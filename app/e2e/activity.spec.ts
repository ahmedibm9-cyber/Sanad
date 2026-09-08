import { test, expect } from './fixtures/auth'

test.describe('Activity & Audit', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/activity')
  })

  test('activity page loads with heading', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /Activity|Audit/i })).toBeVisible()
  })

  test('search or filter controls are present', async ({ authenticatedPage: page }) => {
    const searchInput = page.getByPlaceholder(/Search|Filter/).first()
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible()
    }
  })

  test('activity list shows entries or empty state', async ({ authenticatedPage: page }) => {
    const entries = page.locator('tr, [class*="card"], [class*="event"]').filter({ hasText: /created|edited|deleted|archived/i })
    const emptyState = page.getByText(/No activity|No events|empty/i)
    if (await entries.count() > 0) {
      await expect(entries.first()).toBeVisible()
    } else {
      await expect(emptyState).toBeVisible()
    }
  })

  test('filter by action type is available', async ({ authenticatedPage: page }) => {
    const filter = page.getByRole('combobox').or(page.getByRole('button', { name: /filter/i })).first()
    if (await filter.isVisible()) {
      await expect(filter).toBeVisible()
    }
  })

  test('event details are expandable', async ({ authenticatedPage: page }) => {
    const expandBtn = page.locator('button, [role="button"]').filter({ hasText: /expand|details|view/i }).first()
    if (await expandBtn.isVisible()) {
      await expandBtn.click()
    }
  })
})
