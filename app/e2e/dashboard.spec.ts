import { test, expect } from './fixtures/auth'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
  })

  test('B1: displays welcome message', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/Welcome back/)).toBeVisible()
  })

  test('B2: displays stat cards for projects, tasks, overdue, issues', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('In Progress Projects')).toBeVisible()
    await expect(page.getByText('In Progress Tasks')).toBeVisible()
    await expect(page.getByText('Overdue Tasks')).toBeVisible()
    await expect(page.getByText('Open Issues')).toBeVisible()
  })

  test('B3: My To-dos section is visible', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('My To-dos')).toBeVisible()
  })

  test('B4: Recent Documents section is visible', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Recent Documents')).toBeVisible()
  })

  test('B5: Recent Activity section is visible', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: 'Recent Activity' })).toBeVisible()
  })

  test('B6: Project Status section is visible', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Project Status')).toBeVisible()
  })

  test('B7: sidebar navigation has all main links', async ({ authenticatedPage: page }) => {
    const sidebar = page.locator('nav')
    const links = ['Dashboard', 'Projects', 'Tasks', 'To-dos', 'Customers', 'Materials', 'Factory Code', 'Reports', 'Activity', 'Trash', 'Settings']
    for (const link of links) {
      await expect(sidebar.getByText(link, { exact: true }).first()).toBeVisible()
    }
  })

  test('B8: topbar has search, language toggle, notifications', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Search...').or(page.getByText('بحث...'))).toBeVisible()
    await expect(page.getByRole('button', { name: /Switch language|تبديل اللغة/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Notifications|التنبيهات/ })).toBeVisible()
  })

  test('B9: In Progress Projects card links to /projects', async ({ authenticatedPage: page }) => {
    await page.getByText('In Progress Projects').click()
    await page.waitForURL('**/projects', { timeout: 10_000 })
  })

  test('B10: In Progress Tasks card links to /tasks', async ({ authenticatedPage: page }) => {
    await page.getByText('In Progress Tasks').click()
    await page.waitForURL('**/tasks', { timeout: 10_000 })
  })
})
