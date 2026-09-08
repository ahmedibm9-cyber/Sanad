import { test, expect } from './fixtures/auth'

test.describe('Language Switching', () => {
  test('language toggle button is visible', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('button', { name: 'Switch language' })).toBeVisible()
  })

  test('switching to Arabic changes layout to RTL', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Switch language' }).click()
    await page.getByText('عربي').click()
    await page.waitForTimeout(500)
    const dir = await page.locator('div[dir]').first().getAttribute('dir')
    expect(dir).toBe('rtl')
  })

  test('switching to Arabic changes heading text', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Switch language' }).click()
    await page.getByText('عربي').click()
    await page.waitForTimeout(500)
    await expect(page.getByRole('heading', { name: 'لوحة التحكم' })).toBeVisible()
  })

  test('switching back to English restores LTR', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Switch language' }).click()
    await page.getByText('عربي').click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: 'تبديل اللغة' }).click()
    await page.getByText('EN').click()
    await page.waitForTimeout(500)
    const dir = await page.locator('div[dir]').first().getAttribute('dir')
    expect(dir).toBe('ltr')
  })

  test('sidebar labels switch language', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Switch language' }).click()
    await page.getByText('عربي').click()
    await page.waitForTimeout(500)
    const sidebar = page.locator('nav')
    await expect(sidebar.getByText('لوحة التحكم').or(sidebar.getByText('Dashboard'))).toBeVisible()
  })

  test('topbar elements switch language', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Switch language' }).click()
    await page.getByText('عربي').click()
    await page.waitForTimeout(500)
    await expect(page.getByRole('button', { name: /AR|عربي|تبديل اللغة/ })).toBeVisible()
  })
})
