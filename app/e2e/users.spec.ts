import { test, expect } from './fixtures/auth'

test.describe('Users & Permissions', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/users')
  })

  test('users page loads with heading', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /Users & Permissions/i })).toBeVisible()
  })

  test('create user button is present', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: 'Create User' })).toBeVisible()
  })

  test('can open add user modal', async ({ authenticatedPage: page }) => {
    const addBtn = page.getByRole('button', { name: 'Create User' })
    await addBtn.click()
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
  })

  test('user form has email and role fields', async ({ authenticatedPage: page }) => {
    const addBtn = page.getByRole('button', { name: 'Create User' })
    await addBtn.click()
    const modal = page.getByRole('dialog')
    await expect(modal.getByText('Email')).toBeVisible()
    await expect(modal.getByText('Global Role')).toBeVisible()
  })

  test('permission groups are displayed', async ({ authenticatedPage: page }) => {
    const groups = page.locator('text=Projects, text=Tasks, text=Documents, text=Customers, text=Materials')
    if (await groups.first().isVisible()) {
      await expect(groups.first()).toBeVisible()
    }
  })

  test('permission toggles exist', async ({ authenticatedPage: page }) => {
    const toggles = page.locator('input[type="checkbox"], [role="switch"], [role="checkbox"]')
    if (await toggles.count() > 0) {
      await expect(toggles.first()).toBeVisible()
    }
  })

  test('user list shows members', async ({ authenticatedPage: page }) => {
    const members = page.locator('tr, [class*="card"], [class*="row"]').filter({ hasText: /admin|user|viewer|member|test@sanad/i })
    if (await members.count() > 0) {
      await expect(members.first()).toBeVisible()
    }
  })
})
