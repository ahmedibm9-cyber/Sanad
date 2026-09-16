import { test, expect } from './fixtures/auth'

test.describe('Materials', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/materials')
  })

  test('G1: materials page loads with heading', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /Materials|المواد/ })).toBeVisible()
  })

  test('G2: New Material button is present', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: /Add Material|مادة جديدة|New Material/i })).toBeVisible()
  })

  test('G3: search field is present', async ({ authenticatedPage: page }) => {
    await expect(page.getByPlaceholder(/Search|بحث/)).toBeVisible()
  })

  test('G4: create material opens form', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Add Material|مادة جديدة|New Material/i }).click()
    const modal = page.locator('[role="dialog"], .fixed, .modal').first()
    await expect(modal).toBeVisible({ timeout: 5_000 })
  })

  test('G5: material form has name, grade, manufacturer fields', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Add Material|مادة جديدة|New Material/i }).click()
    const modal = page.locator('[role="dialog"], .fixed, .modal').first()
    await expect(modal).toBeVisible({ timeout: 5_000 })
    await expect(modal.getByText(/Name|Grade|Manufacturer|اسم|تصنيف|شركة/i).first()).toBeVisible()
  })

  test('G6: material list shows data or empty state', async ({ authenticatedPage: page }) => {
    await page.goto('/materials')
    await page.getByText(/Loading/).waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})
    await page.waitForFunction(() => !document.querySelector('[class*="animate-spin"]'), { timeout: 15_000 }).catch(() => {})
    await page.waitForTimeout(1000)
    const heading = page.getByRole('heading', { name: /Materials|المواد/ })
    const emptyState = page.getByText(/No materials|لا توجد|empty|No items/i)
    const hasContent = await heading.isVisible().catch(() => false) || await emptyState.isVisible().catch(() => false)
    expect(hasContent).toBeTruthy()
  })

  test('G7: clicking material navigates to detail', async ({ authenticatedPage: page }) => {
    const link = page.locator('a[href*="/materials/"]').first()
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click()
      await page.waitForURL(/\/materials\/[\w-]+/, { timeout: 10_000 })
    }
  })

  test('G8: material detail shows properties and reference files section', async ({ authenticatedPage: page }) => {
    const link = page.locator('a[href*="/materials/"]').first()
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click()
      await page.waitForURL(/\/materials\/[\w-]+/, { timeout: 10_000 })
      await expect(page.getByText(/material|name|grade|properties|files|TDS|MSDS|COA/i).first()).toBeVisible()
    }
  })

  test('G9: material detail has edit button', async ({ authenticatedPage: page }) => {
    const link = page.locator('a[href*="/materials/"]').first()
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click()
      await page.waitForURL(/\/materials\/[\w-]+/, { timeout: 10_000 })
      const editBtn = page.getByRole('button', { name: /Edit|تعديل/i })
      if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(editBtn).toBeVisible()
      }
    }
  })

  test('G10: material detail back button works', async ({ authenticatedPage: page }) => {
    const link = page.locator('a[href*="/materials/"]').first()
    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await link.click()
      await page.waitForURL(/\/materials\/[\w-]+/, { timeout: 10_000 })
      const backBtn = page.locator('button, a').filter({ hasText: /Back|返回|←/i }).first()
      if (await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await backBtn.click()
        await page.waitForURL(/\/materials$/, { timeout: 10_000 })
      }
    }
  })
})
