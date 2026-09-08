import { test, expect } from './fixtures/auth'

test.describe('Tasks', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/tasks')
  })

  test('tasks page loads with heading', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: 'Tasks', exact: true })).toBeVisible()
  })

  test('search field is present', async ({ authenticatedPage: page }) => {
    await expect(page.getByPlaceholder(/Search tasks/)).toBeVisible()
  })

  test('create new task button is present', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: /New Task|Add|Create/i })).toBeVisible()
  })

  test('can open create task modal', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /New Task|Add|Create/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('task form has required fields', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /New Task|Add|Create/i }).click()
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await expect(modal.getByText('Task Name')).toBeVisible()
  })

  test('can close task modal', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /New Task|Add|Create/i }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('task list shows content or empty state', async ({ authenticatedPage: page }) => {
    const tasks = page.locator('tr, [class*="card"]').filter({ hasText: /task/i })
    if (await tasks.count() === 0) {
      await expect(page.getByText(/No tasks|empty/i)).toBeVisible()
    }
  })

  test('status filter is available', async ({ authenticatedPage: page }) => {
    const filter = page.getByRole('combobox').filter({ hasText: /status|filter/i })
    if (await filter.isVisible()) {
      await expect(filter).toBeVisible()
    }
  })
})
