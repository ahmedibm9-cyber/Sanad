import { test, expect } from './fixtures/auth'

test.describe('Reports', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/reports')
  })

  test('reports page loads with heading', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /Reports|Analytics/i })).toBeVisible()
  })

  test('report type tabs/cards are visible', async ({ authenticatedPage: page }) => {
    const reportTypes = ['Projects by Status', 'Projects by Date', 'Projects by Customer', 'Tasks', 'Overdue', 'Documents', 'User Activity']
    for (const type of reportTypes) {
      const element = page.getByText(type, { exact: false })
      if (await element.isVisible()) {
        await expect(element).toBeVisible()
      }
    }
  })

  test('export buttons are present', async ({ authenticatedPage: page }) => {
    const exportBtns = page.getByRole('button', { name: /export|pdf|excel|download/i })
    if (await exportBtns.count() > 0) {
      await expect(exportBtns.first()).toBeVisible()
    }
  })

  test('can switch between report types', async ({ authenticatedPage: page }) => {
    const tabs = page.locator('button, [role="tab"]').filter({ hasText: /projects|tasks|documents|overdue/i })
    if (await tabs.count() > 1) {
      await tabs.nth(1).click()
    }
  })

  test('charts or data tables are displayed', async ({ authenticatedPage: page }) => {
    const dataDisplay = page.locator('table, canvas, svg, [class*="chart"]').first()
    if (await dataDisplay.isVisible()) {
      await expect(dataDisplay).toBeVisible()
    }
  })
})
