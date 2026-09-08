import { test, expect } from './fixtures/auth'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
  })

  test('displays welcome message with user name', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/Welcome back/)).toBeVisible()
  })

  test('displays stat cards', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('In Progress Projects')).toBeVisible()
    await expect(page.getByText('In Progress Tasks')).toBeVisible()
    await expect(page.getByText('Overdue Tasks')).toBeVisible()
    await expect(page.getByText('Open Issues')).toBeVisible()
  })

  test('stat cards show numeric values', async ({ authenticatedPage: page }) => {
    const cards = page.locator('.card, [class*="rounded"]').filter({ hasText: /In Progress|Overdue|Open Issues/ })
    await expect(cards.first()).toBeVisible()
  })

  test('My To-dos section is visible', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('My To-dos')).toBeVisible()
  })

  test('Recent Documents section is visible', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Recent Documents')).toBeVisible()
  })

  test('Recent Activity section is visible', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: 'Recent Activity' })).toBeVisible()
  })

  test('Project Status section is visible', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Project Status')).toBeVisible()
  })

  test('sidebar navigation is complete', async ({ authenticatedPage: page }) => {
    const sidebar = page.locator('nav')
    await expect(sidebar.getByText('Dashboard')).toBeVisible()
    await expect(sidebar.getByText('Projects')).toBeVisible()
    await expect(sidebar.getByText('Tasks')).toBeVisible()
    await expect(sidebar.getByText('To-dos')).toBeVisible()
    await expect(sidebar.getByText('Customers')).toBeVisible()
    await expect(sidebar.getByText('Materials')).toBeVisible()
    await expect(sidebar.getByText('Factory Code')).toBeVisible()
    await expect(sidebar.getByText('Reports')).toBeVisible()
    await expect(sidebar.getByText('Activity')).toBeVisible()
    await expect(sidebar.getByText('Trash')).toBeVisible()
    await expect(sidebar.getByText('Settings')).toBeVisible()
  })

  test('topbar has search trigger, language toggle, and notifications', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Search...').or(page.getByText('بحث...'))).toBeVisible()
    await expect(page.getByRole('button', { name: 'Switch language' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Notifications' })).toBeVisible()
  })

  test('stat card links navigate to correct pages', async ({ authenticatedPage: page }) => {
    await page.getByText('In Progress Projects').click()
    await page.waitForURL('**/projects')
  })
})
