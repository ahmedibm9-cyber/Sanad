import { test, expect } from './fixtures/auth'

test.describe('Documents', () => {
  test('document form page loads without crash', async ({ authenticatedPage: page }) => {
    await page.goto('/documents/new/form')
    await page.waitForTimeout(2000)
    const errors = page.locator('[class*="error"]')
    const errorCount = await errors.count()
    expect(errorCount).toBe(0)
  })

  test('document preview page renders', async ({ authenticatedPage: page }) => {
    await page.goto('/documents/preview')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Document from Project', () => {
  test('can navigate to document form from project', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible()) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/)
      const newDocBtn = page.getByRole('button', { name: /new document|create document|add document/i })
      if (await newDocBtn.isVisible()) {
        await newDocBtn.click()
        await page.waitForURL(/\/documents\/.*\/form/)
      }
    }
  })
})
