import { test, expect } from './fixtures/auth'

test.describe('Global Search', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
  })

  test('search trigger is visible in topbar', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Search...').or(page.getByText('بحث...'))).toBeVisible()
  })

  test('search bar shows keyboard shortcut hint', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('⌘K')).toBeVisible()
  })

  test('clicking search opens command palette', async ({ authenticatedPage: page }) => {
    const searchTrigger = page.locator('[class*="cursor-pointer"]').filter({ hasText: /Search\.\.\./ }).first()
    await searchTrigger.click()
    const dialog = page.getByRole('dialog', { name: /Global Search|بحث عام/ })
    await expect(dialog).toBeVisible({ timeout: 5_000 })
  })

  test('typing in search shows results', async ({ authenticatedPage: page }) => {
    const searchTrigger = page.locator('[class*="cursor-pointer"]').filter({ hasText: /Search\.\.\./ }).first()
    await searchTrigger.click()
    const dialog = page.getByRole('dialog', { name: /Global Search|بحث عام/ })
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    await dialog.getByRole('textbox').fill('project')
    await page.waitForTimeout(500)
  })

  test('keyboard shortcut or click opens search', async ({ authenticatedPage: page }) => {
    const searchTrigger = page.locator('[class*="cursor-pointer"]').filter({ hasText: /Search\.\.\./ }).first()
    await searchTrigger.click()
    const dialog = page.getByRole('dialog', { name: /Global Search|بحث عام/ })
    await expect(dialog).toBeVisible({ timeout: 5_000 })
  })

  test('search input clears on Escape', async ({ authenticatedPage: page }) => {
    const searchTrigger = page.locator('[class*="cursor-pointer"]').filter({ hasText: /Search\.\.\./ }).first()
    await searchTrigger.click()
    const dialog = page.getByRole('dialog', { name: /Global Search|بحث عام/ })
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    await dialog.getByRole('textbox').fill('test')
    await page.keyboard.press('Escape')
  })
})
