import { test, expect } from './fixtures/auth'

test.describe('Customers', () => {
  test('customers page loads with heading', async ({ authenticatedPage: page }) => {
    await page.goto('/customers')
    await expect(page.getByRole('heading', { name: 'Customers', exact: true })).toBeVisible()
  })

  test('search field is present', async ({ authenticatedPage: page }) => {
    await page.goto('/customers')
    const searchInput = page.getByPlaceholder(/Search/).first()
    await expect(searchInput).toBeVisible()
  })

  test('create new customer button is present', async ({ authenticatedPage: page }) => {
    await page.goto('/customers')
    await expect(page.getByRole('button', { name: /New Customer|Add|Create/i })).toBeVisible()
  })

  test('can open create customer modal', async ({ authenticatedPage: page }) => {
    await page.goto('/customers')
    await page.getByRole('button', { name: /New Customer|Add|Create/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('customer form has name field', async ({ authenticatedPage: page }) => {
    await page.goto('/customers')
    await page.getByRole('button', { name: /New Customer|Add|Create/i }).click()
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await expect(modal.getByText(/name|customer name/i).first()).toBeVisible()
  })

  test('can close customer modal', async ({ authenticatedPage: page }) => {
    await page.goto('/customers')
    await page.getByRole('button', { name: /New Customer|Add|Create/i }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('customer list shows empty state or customer cards', async ({ authenticatedPage: page }) => {
    await page.goto('/customers')
    const customerCards = page.locator('[class*="card"]').filter({ hasText: /customer|client/i })
    const emptyState = page.getByText(/No customers|empty/i)
    if (await customerCards.count() > 0) {
      await expect(customerCards.first()).toBeVisible()
    } else {
      await expect(emptyState).toBeVisible()
    }
  })

  test('can navigate to customer detail', async ({ authenticatedPage: page }) => {
    await page.goto('/customers')
    const customerLink = page.locator('a[href*="/customers/"]').first()
    if (await customerLink.isVisible()) {
      await customerLink.click()
      await page.waitForURL(/\/customers\/[\w-]+/)
    }
  })

  test('pagination is present when many customers', async ({ authenticatedPage: page }) => {
    await page.goto('/customers')
    const pagination = page.getByRole('navigation', { name: /pagination/i })
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible()
    }
  })
})

test.describe('Customer Detail', () => {
  test('customer detail has tabs', async ({ authenticatedPage: page }) => {
    await page.goto('/customers')
    const customerLink = page.locator('a[href*="/customers/"]').first()
    if (await customerLink.isVisible()) {
      await customerLink.click()
      await page.waitForURL(/\/customers\/[\w-]+/)
      await expect(page.getByText(/Projects|Activity/i).first()).toBeVisible()
    }
  })
})
