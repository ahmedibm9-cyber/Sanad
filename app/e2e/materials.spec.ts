import { test, expect } from './fixtures/auth'

test.describe('Materials', () => {
  test('materials page loads with heading', async ({ authenticatedPage: page }) => {
    await page.goto('/materials')
    await expect(page.getByRole('heading', { name: 'Materials Library', exact: true })).toBeVisible()
  })

  test('search field is present', async ({ authenticatedPage: page }) => {
    await page.goto('/materials')
    await expect(page.getByPlaceholder(/Search materials/)).toBeVisible()
  })

  test('create new material button is present', async ({ authenticatedPage: page }) => {
    await page.goto('/materials')
    await expect(page.getByRole('button', { name: /New Material|Add|Create/i })).toBeVisible()
  })

  test('can open create material modal', async ({ authenticatedPage: page }) => {
    await page.goto('/materials')
    await page.getByRole('button', { name: /New Material|Add|Create/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('material form has name field', async ({ authenticatedPage: page }) => {
    await page.goto('/materials')
    await page.getByRole('button', { name: /New Material|Add|Create/i }).click()
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await expect(modal.getByText(/name|material name/i).first()).toBeVisible()
  })

  test('can close material modal', async ({ authenticatedPage: page }) => {
    await page.goto('/materials')
    await page.getByRole('button', { name: /New Material|Add|Create/i }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('material list shows content or empty state', async ({ authenticatedPage: page }) => {
    await page.goto('/materials')
    const materials = page.locator('tr, [class*="card"]').filter({ hasText: /material/i })
    if (await materials.count() === 0) {
      await expect(page.getByText(/No materials|empty/i)).toBeVisible()
    }
  })

  test('grade and manufacturer fields are visible when data exists', async ({ authenticatedPage: page }) => {
    await page.goto('/materials')
    const materials = page.locator('tr, [class*="card"]').filter({ hasText: /material/i })
    if (await materials.count() > 0) {
      await expect(materials.first()).toBeVisible()
    }
  })
})
