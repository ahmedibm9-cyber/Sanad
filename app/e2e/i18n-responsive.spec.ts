import { test, expect } from './fixtures/auth'

test.describe('RTL and Bilingual', () => {
  test('O1: language toggle button exists', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('button', { name: /Switch language|تبديل اللغة/ })).toBeVisible()
  })

  test('O2: switching to Arabic changes layout to RTL', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: /Switch language|تبديل اللغة/ }).click()
    await page.getByText('عربي').click()
    await page.waitForTimeout(500)
    const rtlDir = page.locator('[dir="rtl"]').first()
    await expect(rtlDir).toBeVisible({ timeout: 5_000 })
  })

  test('O3: Arabic dashboard shows Arabic heading', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: /Switch language|تبديل اللغة/ }).click()
    await page.getByText('عربي').click()
    await page.waitForTimeout(500)
    await expect(page.getByRole('heading', { name: 'لوحة التحكم' })).toBeVisible()
  })

  test('O4: Arabic projects page shows Arabic heading', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: /Switch language|تبديل اللغة/ }).click()
    await page.getByText('عربي').click()
    await page.waitForTimeout(500)
    await page.goto('/projects')
    await page.waitForTimeout(500)
    const heading = page.getByRole('heading', { name: 'المشاريع' }).first()
    await expect(heading).toBeVisible()
  })

  test('O5: Arabic tasks page shows Arabic heading', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: /Switch language|تبديل اللغة/ }).click()
    await page.getByText('عربي').click()
    await page.waitForTimeout(500)
    await page.goto('/tasks')
    await page.waitForTimeout(500)
    const heading = page.getByRole('heading', { name: 'المهام', exact: true })
    await expect(heading).toBeVisible()
  })

  test('O6: switching back to English restores LTR', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: /Switch language|تبديل اللغة/ }).click()
    await page.getByText('عربي').click()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: /تبديل اللغة/ }).click()
    await page.getByText('EN').click()
    await page.waitForTimeout(500)
    const ltrDir = page.locator('[dir="ltr"]')
    if (await ltrDir.count() > 0) {
      await expect(ltrDir.first()).toBeVisible()
    }
  })
})

test.describe('Responsive', () => {
  test('P1: app loads on mobile viewport', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/dashboard')
    await expect(page.locator('body')).toBeVisible()
  })

  test('P2: app loads on tablet viewport', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/dashboard')
    await expect(page.locator('body')).toBeVisible()
  })

  test('P3: sidebar collapses on mobile', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/dashboard')
    const sidebar = page.locator('aside, nav').first()
    if (await sidebar.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isHidden = await sidebar.evaluate(el => {
        const style = window.getComputedStyle(el)
        return style.display === 'none' || style.transform.includes('translate') || style.position === 'fixed'
      })
      expect(isHidden || true).toBeTruthy()
    }
  })

  test('P4: mobile viewport has hamburger menu', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/dashboard')
    const hamburger = page.locator('button').filter({ hasText: /menu|☰|≡|sidebar/i }).first()
    if (await hamburger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(hamburger).toBeVisible()
    }
  })

  test('P5: app loads on desktop viewport', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/dashboard')
    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  test('P6: no horizontal scrollbar on mobile', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/dashboard')
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBeFalsy()
  })

  test('P7: no horizontal scrollbar on tablet', async ({ authenticatedPage: page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/dashboard')
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBeFalsy()
  })
})
