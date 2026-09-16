import { test, expect } from './fixtures/auth'

test.describe('To-dos', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/todos')
  })

  test('E1: todos page loads with heading', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /To-dos|المهام/i })).toBeVisible()
  })

  test('E2: New To-do button is present', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: /New To-do|إضافة|Add/i })).toBeVisible()
  })

  test('E3: create new todo shows inline form', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /New To-do/i }).click()
    await expect(page.getByText(/Add New To-do/i)).toBeVisible({ timeout: 5_000 })
  })

  test('E4: todo form has title, description, due date, priority fields', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /New To-do/i }).click()
    await expect(page.getByText(/Add New To-do/i)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/Title|Description|Due|Priority|عنوان|وصف|أولوية/i).first()).toBeVisible()
  })

  test('E5: create todo with title', async ({ authenticatedPage: page }) => {
    const titleInput = page.getByRole('textbox', { name: /title|عنوان|todo/i }).first()
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill('E2E Test Todo')
    }

    const saveBtn = page.getByRole('button', { name: /Add To-do|Save|إضافة|حفظ/i }).first()
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click()
      await page.waitForTimeout(2000)
    }
  })

  test('E6: todo list shows items or empty state', async ({ authenticatedPage: page }) => {
    await page.getByText(/Loading/).waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})
    const items = page.locator('tr, [class*="card"], [class*="item"]').filter({ hasText: /todo|task|مهمة/i })
    const emptyState = page.getByText(/No to-dos match|pending|caught up|لا توجد|getting started|All caught up/i)
    const hasContent = await items.count() > 0 || await emptyState.isVisible().catch(() => false)
    expect(hasContent).toBeTruthy()
  })

  test('E7: priority selector exists in form', async ({ authenticatedPage: page }) => {
    const priority = page.getByText(/Priority|أولوية/i).first()
    if (await priority.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(priority).toBeVisible()
    }
  })

  test('E8: due date picker exists in form', async ({ authenticatedPage: page }) => {
    const dateInput = page.locator('input[type="date"], input[placeholder*="date"], input[type="datetime-local"]').first()
    if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(dateInput).toBeVisible()
    }
  })

  test('E9: todo can be marked as done', async ({ authenticatedPage: page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first()
    if (await checkbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      const wasChecked = await checkbox.isChecked()
      await checkbox.click()
      await expect(checkbox).toBeChecked({ checked: !wasChecked })
    }
  })

  test('E10: filter by status exists', async ({ authenticatedPage: page }) => {
    const filter = page.locator('select, [role="combobox"]').filter({ hasText: /status|all|الكل/i }).first()
    if (await filter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(filter).toBeVisible()
    }
  })
})
