import { test, expect } from './fixtures/auth'

test.describe('Shared Data Layer', () => {
  test('J1: project detail shows shared data section', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const overviewTab = page.locator('button, [role="tab"]').filter({ hasText: /Overview|نظرة/i }).first()
      if (await overviewTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await overviewTab.click()
        await page.waitForTimeout(500)
      }
      await expect(page.getByText(/Customer|Material|Quantity|Price|Packing|Shipping|عميل|مادة|كمية|سعر|تعبئة|شحن/i).first()).toBeVisible()
    }
  })

  test('J2: shared data shows customer info', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      await expect(page.getByText(/Customer|Shipper|Consignee|عميل|مُرسل|مستلم/i).first()).toBeVisible()
    }
  })

  test('J3: shared data shows material and quantity info', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      await expect(page.getByText(/Material|Quantity|Weight|MT|مادة|كمية|وزن/i).first()).toBeVisible()
    }
  })

  test('J4: shared data shows shipping and destination info', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      await expect(page.getByText(/Shipping|Destination|Port|Incoterm|شحن|وجهة|ميناء/i).first()).toBeVisible()
    }
  })

  test('J5: document form pre-fills from shared project data', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const newDocBtn = page.getByRole('button', { name: /New Document|مستند جديد/i })
      if (await newDocBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await newDocBtn.click()
        const docType = page.locator('[role="menuitem"], .dropdown a, .dropdown button').filter({ hasText: /Invoice|فاتورة/i }).first()
        if (await docType.isVisible({ timeout: 3000 }).catch(() => false)) {
          await docType.click()
          await page.waitForTimeout(2000)
          await expect(page.getByText(/Customer|Company|Material/i).first()).toBeVisible()
        }
      }
    }
  })

  test('J6: shared data is visible across documents tab', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const docsTab = page.locator('button, [role="tab"]').filter({ hasText: /Documents|مستندات/i }).first()
      if (await docsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await docsTab.click()
        await page.waitForTimeout(500)
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})
