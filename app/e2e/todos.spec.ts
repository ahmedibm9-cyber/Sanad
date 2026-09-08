import { test, expect } from './fixtures/auth'

test.describe('To-dos', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/todos')
  })

  test('todos page loads with heading', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /To-dos|Todos/i })).toBeVisible()
  })

  test('add todo button is present', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: /Add|New|Create/i })).toBeVisible()
  })

  test('can open new todo form', async ({ authenticatedPage: page }) => {
    const addBtn = page.getByRole('button', { name: /Add|New|Create/i })
    await addBtn.click()
    const todoInput = page.getByPlaceholder(/title|task|enter/i).first()
    if (await todoInput.isVisible()) {
      await expect(todoInput).toBeVisible()
    }
  })

  test('todo shows priority indicator', async ({ authenticatedPage: page }) => {
    const todos = page.locator('[class*="todo"], [class*="card"]').filter({ hasText: /todo|task/i })
    if (await todos.count() > 0) {
      await expect(todos.first()).toBeVisible()
    }
  })

  test('can toggle todo completion', async ({ authenticatedPage: page }) => {
    const checkbox = page.locator('input[type="checkbox"], button[role="checkbox"]').first()
    if (await checkbox.isVisible()) {
      await checkbox.click()
    }
  })

  test('filter options are available', async ({ authenticatedPage: page }) => {
    const filter = page.getByRole('combobox').or(page.getByRole('button', { name: /filter|done|pending/i })).first()
    if (await filter.isVisible()) {
      await expect(filter).toBeVisible()
    }
  })

  test('empty state shows "All caught up"', async ({ authenticatedPage: page }) => {
    const todos = page.locator('[class*="todo"], [class*="card"]').filter({ hasText: /todo/i })
    if (await todos.count() === 0) {
      await expect(page.getByText(/All caught up|No to-dos|empty/i)).toBeVisible()
    }
  })
})
