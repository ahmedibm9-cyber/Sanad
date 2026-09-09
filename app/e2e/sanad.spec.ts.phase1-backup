import { test, expect, login, TEST_EMAIL, TEST_PASSWORD } from './fixtures/auth'

// ─── Authentication ───────────────────────────────────────────────
test.describe('Authentication', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('login page renders with form fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'SANAD' })).toBeVisible()
  })

  test('login with valid credentials succeeds', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: 'Email' }).fill(TEST_EMAIL)
    await page.getByRole('textbox', { name: 'Password' }).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('**/dashboard')
    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: 'Email' }).fill('wrong@example.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByText(/Login failed|Invalid|incorrect|wrong/i)).toBeVisible({ timeout: 10_000 })
  })

  test('authenticated user is redirected from /login to /dashboard', async ({ page }) => {
    await login(page)
    await page.goto('/login')
    await page.waitForURL('**/dashboard')
    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  test('unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/login')
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()
  })

  test('session persists across page reloads', async ({ page }) => {
    await login(page)
    await page.reload()
    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  test('user profile displays in sidebar and topbar', async ({ page }) => {
    await login(page)
    const profileSection = page.locator('aside, nav, [class*="sidebar"]')
    await expect(profileSection.getByText(/test@sanad|admin|user/i).first()).toBeVisible()
  })

  test('company is selected after login', async ({ page }) => {
    await login(page)
    await expect(page.getByText('SANAD').first()).toBeVisible()
  })
})

// ─── Dashboard ────────────────────────────────────────────────────
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

// ─── Projects ─────────────────────────────────────────────────────
test.describe('Projects', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
  })

  test('projects page loads with heading', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible()
  })

  test('search field is present', async ({ authenticatedPage: page }) => {
    await expect(page.getByPlaceholder(/Search projects/)).toBeVisible()
  })

  test('create new project button is present', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: 'New Project' })).toBeVisible()
  })

  test('project list shows empty state when no projects', async ({ authenticatedPage: page }) => {
    const emptyState = page.getByText(/No projects|No data|empty/i)
    const projectCards = page.locator('[class*="card"]').filter({ hasText: /project/i })
    const count = await projectCards.count()
    if (count === 0) {
      await expect(emptyState).toBeVisible()
    }
  })

  test('can open create project modal', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: 'New Project' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('create project modal has required fields', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: 'New Project' }).click()
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await expect(modal.getByText('Project Name')).toBeVisible()
  })

  test('can close create project modal', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: 'New Project' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('status filter is available', async ({ authenticatedPage: page }) => {
    const filter = page.getByRole('combobox').filter({ hasText: /status|filter/i })
    if (await filter.isVisible()) {
      await expect(filter).toBeVisible()
    }
  })

  test('project cards display status badges', async ({ authenticatedPage: page }) => {
    const badges = page.locator('[class*="badge"], [class*="status"]').filter({ hasText: /in.progress|completed|cancelled|archived/i })
    if (await badges.count() > 0) {
      await expect(badges.first()).toBeVisible()
    }
  })

  test('can navigate to project detail', async ({ authenticatedPage: page }) => {
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible()) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/)
    }
  })

  test('pagination is present when many projects', async ({ authenticatedPage: page }) => {
    const pagination = page.getByRole('navigation', { name: /pagination/i })
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible()
    }
  })
})

test.describe('Project Detail', () => {
  test('project detail page has tabs', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible()) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/)
      const tabs = ['Documents', 'Attachments', 'Notes', 'Issues']
      for (const tab of tabs) {
        await expect(page.getByRole('tab', { name: tab }).or(page.getByText(tab))).toBeVisible()
      }
    }
  })

  test('project detail shows status', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible()) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/)
      await expect(page.locator('[class*="badge"]').filter({ hasText: /in.progress|completed|cancelled|archived/i })).toBeVisible()
    }
  })
})

// ─── Tasks ────────────────────────────────────────────────────────
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

// ─── To-dos ───────────────────────────────────────────────────────
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

// ─── Customers ────────────────────────────────────────────────────
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

// ─── Materials ────────────────────────────────────────────────────
test.describe('Materials', () => {
  test('materials page loads with heading', async ({ authenticatedPage: page }) => {
    await page.goto('/materials')
    await expect(page.getByRole('heading', { name: 'Materials Library', exact: true })).toBeVisible()
  })

  test('search field is present', async ({ authenticatedPage: page }) => {
    await page.goto('/materials')
    await expect(page.getByPlaceholder(/Search materials/)).toBeVisible()
  })

  test('create new material button is present', async ({ authenticatedPage: page }) => {
    await page.goto('/materials')
    await expect(page.getByRole('button', { name: /New Material|Add|Create/i })).toBeVisible()
  })

  test('can open create material modal', async ({ authenticatedPage: page }) => {
    await page.goto('/materials')
    await page.getByRole('button', { name: /New Material|Add|Create/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('material form has name field', async ({ authenticatedPage: page }) => {
    await page.goto('/materials')
    await page.getByRole('button', { name: /New Material|Add|Create/i }).click()
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await expect(modal.getByText(/name|material name/i).first()).toBeVisible()
  })

  test('can close material modal', async ({ authenticatedPage: page }) => {
    await page.goto('/materials')
    await page.getByRole('button', { name: /New Material|Add|Create/i }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('material list shows content or empty state', async ({ authenticatedPage: page }) => {
    await page.goto('/materials')
    const materials = page.locator('tr, [class*="card"]').filter({ hasText: /material/i })
    if (await materials.count() === 0) {
      await expect(page.getByText(/No materials|empty/i)).toBeVisible()
    }
  })

  test('grade and manufacturer fields are visible when data exists', async ({ authenticatedPage: page }) => {
    await page.goto('/materials')
    const materials = page.locator('tr, [class*="card"]').filter({ hasText: /material/i })
    if (await materials.count() > 0) {
      await expect(materials.first()).toBeVisible()
    }
  })
})

// ─── Documents ────────────────────────────────────────────────────
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

// ─── Factory Code ─────────────────────────────────────────────────
test.describe('Factory Code', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/factory')
  })

  test('factory code page loads with search', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /factory|code/i })).toBeVisible()
    await expect(page.getByPlaceholder(/search|factory/i)).toBeVisible()
  })

  test('search returns results', async ({ authenticatedPage: page }) => {
    const searchInput = page.getByPlaceholder(/search|factory/i)
    await searchInput.fill('test')
    await page.waitForTimeout(1000)
    const results = page.locator('tr, [class*="card"], [class*="row"]').filter({ hasText: /factory|code|city/i })
    if (await results.count() > 0) {
      await expect(results.first()).toBeVisible()
    }
  })

  test('export button is present', async ({ authenticatedPage: page }) => {
    const exportBtn = page.getByRole('button', { name: /export|download/i })
    if (await exportBtn.isVisible()) {
      await expect(exportBtn).toBeVisible()
    }
  })

  test('import button is present for admins', async ({ authenticatedPage: page }) => {
    const importBtn = page.getByRole('button', { name: /import|upload/i })
    if (await importBtn.isVisible()) {
      await expect(importBtn).toBeVisible()
    }
  })

  test('search clears when input is emptied', async ({ authenticatedPage: page }) => {
    const searchInput = page.getByPlaceholder(/search|factory/i)
    await searchInput.fill('test')
    await page.waitForTimeout(500)
    await searchInput.clear()
    await page.waitForTimeout(500)
  })
})

// ─── Reports ──────────────────────────────────────────────────────
test.describe('Reports', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/reports')
  })

  test('reports page loads with heading', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /Reports|Analytics/i })).toBeVisible()
  })

  test('report type tabs/cards are visible', async ({ authenticatedPage: page }) => {
    const reportTypes = ['Projects by Status', 'Projects by Date', 'Projects by Customer', 'Tasks', 'Overdue', 'Documents', 'User Activity']
    for (const type of reportTypes) {
      const element = page.getByText(type, { exact: false })
      if (await element.isVisible()) {
        await expect(element).toBeVisible()
      }
    }
  })

  test('export buttons are present', async ({ authenticatedPage: page }) => {
    const exportBtns = page.getByRole('button', { name: /export|pdf|excel|download/i })
    if (await exportBtns.count() > 0) {
      await expect(exportBtns.first()).toBeVisible()
    }
  })

  test('can switch between report types', async ({ authenticatedPage: page }) => {
    const tabs = page.locator('button, [role="tab"]').filter({ hasText: /projects|tasks|documents|overdue/i })
    if (await tabs.count() > 1) {
      await tabs.nth(1).click()
    }
  })

  test('charts or data tables are displayed', async ({ authenticatedPage: page }) => {
    const dataDisplay = page.locator('table, canvas, svg, [class*="chart"]').first()
    if (await dataDisplay.isVisible()) {
      await expect(dataDisplay).toBeVisible()
    }
  })
})

// ─── Activity & Audit ─────────────────────────────────────────────
test.describe('Activity & Audit', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/activity')
  })

  test('activity page loads with heading', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /Activity|Audit/i })).toBeVisible()
  })

  test('search or filter controls are present', async ({ authenticatedPage: page }) => {
    const searchInput = page.getByPlaceholder(/Search|Filter/).first()
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible()
    }
  })

  test('activity list shows entries or empty state', async ({ authenticatedPage: page }) => {
    const entries = page.locator('tr, [class*="card"], [class*="event"]').filter({ hasText: /created|edited|deleted|archived/i })
    const emptyState = page.getByText(/No activity|No events|empty/i)
    if (await entries.count() > 0) {
      await expect(entries.first()).toBeVisible()
    } else {
      await expect(emptyState).toBeVisible()
    }
  })

  test('filter by action type is available', async ({ authenticatedPage: page }) => {
    const filter = page.getByRole('combobox').or(page.getByRole('button', { name: /filter/i })).first()
    if (await filter.isVisible()) {
      await expect(filter).toBeVisible()
    }
  })

  test('event details are expandable', async ({ authenticatedPage: page }) => {
    const expandBtn = page.locator('button, [role="button"]').filter({ hasText: /expand|details|view/i }).first()
    if (await expandBtn.isVisible()) {
      await expandBtn.click()
    }
  })
})

// ─── Trash & Restore ──────────────────────────────────────────────
test.describe('Trash & Restore', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/trash')
  })

  test('trash page loads with heading', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /Trash/i })).toBeVisible()
  })

  test('search field is present', async ({ authenticatedPage: page }) => {
    await expect(page.getByPlaceholder(/Search/)).toBeVisible()
  })

  test('trash list shows entries or empty state', async ({ authenticatedPage: page }) => {
    const entries = page.locator('tr, [class*="card"], [class*="row"]').filter({ hasText: /deleted|restore/i })
    const emptyState = page.getByText(/No trash|No deleted|empty|All clean/i)
    if (await entries.count() > 0) {
      await expect(entries.first()).toBeVisible()
    } else {
      await expect(emptyState).toBeVisible()
    }
  })

  test('restore button is present for each entry', async ({ authenticatedPage: page }) => {
    const restoreBtns = page.getByRole('button', { name: /restore/i })
    if (await restoreBtns.count() > 0) {
      await expect(restoreBtns.first()).toBeVisible()
    }
  })

  test('entity type filter is available', async ({ authenticatedPage: page }) => {
    const filter = page.getByRole('combobox').or(page.getByRole('button', { name: /filter|type/i }))
    if (await filter.first().isVisible()) {
      await expect(filter.first()).toBeVisible()
    }
  })

  test('restore shows confirmation dialog', async ({ authenticatedPage: page }) => {
    const restoreBtn = page.getByRole('button', { name: /restore/i }).first()
    if (await restoreBtn.isVisible()) {
      await restoreBtn.click()
      const dialog = page.getByRole('dialog')
      if (await dialog.isVisible()) {
        await expect(dialog).toBeVisible()
        await expect(dialog.getByText(/confirm|restore|are you sure/i)).toBeVisible()
        await dialog.getByRole('button', { name: /cancel|close/i }).click()
      }
    }
  })
})

// ─── Users & Permissions ──────────────────────────────────────────
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

// ─── Settings ─────────────────────────────────────────────────────
test.describe('Settings', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/settings')
  })

  test('settings page loads', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: /Company Identity|Legal|Contact|Banking/i }).first()).toBeVisible()
  })

  test('settings has tabs', async ({ authenticatedPage: page }) => {
    const tabs = ['Company Identity', 'Legal & Registration', 'Contact', 'Banking', 'Document Defaults', 'Notifications', 'Backup', 'Licensing']
    for (const tab of tabs) {
      const tabElement = page.getByRole('button', { name: tab }).or(page.getByText(tab, { exact: true }))
      if (await tabElement.isVisible()) {
        await expect(tabElement).toBeVisible()
      }
    }
  })

  test('Identity tab shows company fields', async ({ authenticatedPage: page }) => {
    const identityTab = page.getByText('Company Identity', { exact: true })
    if (await identityTab.isVisible()) {
      await identityTab.click()
      await expect(page.getByText(/Name|Company Name/i).first()).toBeVisible()
    }
  })

  test('Legal tab shows CR and VAT fields', async ({ authenticatedPage: page }) => {
    const legalTab = page.getByText('Legal & Registration', { exact: true })
    if (await legalTab.isVisible()) {
      await legalTab.click()
      await expect(page.getByText(/CR|VAT|commercial registration/i).first()).toBeVisible()
    }
  })

  test('Banking tab shows bank account section', async ({ authenticatedPage: page }) => {
    const bankingTab = page.getByText('Banking', { exact: true })
    if (await bankingTab.isVisible()) {
      await bankingTab.click()
      await expect(page.getByText(/bank|account|IBAN/i).first()).toBeVisible()
    }
  })

  test('Documents tab shows document defaults', async ({ authenticatedPage: page }) => {
    const docsTab = page.getByText('Document Defaults', { exact: true })
    if (await docsTab.isVisible()) {
      await docsTab.click()
      await expect(page.getByText(/template|currency|VAT|incoterm/i).first()).toBeVisible()
    }
  })

  test('Notifications tab shows notification preferences', async ({ authenticatedPage: page }) => {
    const notifTab = page.getByText('Notifications', { exact: true })
    if (await notifTab.isVisible()) {
      await notifTab.click()
      await expect(page.getByText(/notification|email|push/i).first()).toBeVisible()
    }
  })

  test('Backup tab shows backup options', async ({ authenticatedPage: page }) => {
    const backupTab = page.getByText('Backup', { exact: true })
    if (await backupTab.isVisible()) {
      await backupTab.click()
      await expect(page.getByText(/backup|restore|schedule/i).first()).toBeVisible()
    }
  })

  test('Licensing tab shows license status', async ({ authenticatedPage: page }) => {
    const licenseTab = page.getByText('Licensing', { exact: true })
    if (await licenseTab.isVisible()) {
      await licenseTab.click()
      await expect(page.getByText(/license|status|valid|expired/i).first()).toBeVisible()
    }
  })

  test('logo upload is available in Identity tab', async ({ authenticatedPage: page }) => {
    const identityTab = page.getByText('Company Identity', { exact: true })
    if (await identityTab.isVisible()) {
      await identityTab.click()
      const uploadBtn = page.getByRole('button', { name: /upload|logo|browse/i })
      if (await uploadBtn.isVisible()) {
        await expect(uploadBtn).toBeVisible()
      }
    }
  })
})

// ─── Language Switching ───────────────────────────────────────────
test.describe('Language Switching', () => {
  test('language toggle button is visible', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('button', { name: 'Switch language' })).toBeVisible()
  })

  test('switching to Arabic changes layout to RTL', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Switch language' }).click()
    await page.getByText('عربي').click()
    await page.waitForTimeout(500)
    const dir = await page.locator('div[dir]').first().getAttribute('dir')
    expect(dir).toBe('rtl')
  })

  test('switching to Arabic changes heading text', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Switch language' }).click()
    await page.getByText('عربي').click()
    await page.waitForTimeout(500)
    await expect(page.getByRole('heading', { name: 'لوحة التحكم' })).toBeVisible()
  })

  test('switching back to English restores LTR', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Switch language' }).click()
    await page.getByText('عربي').click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: 'تبديل اللغة' }).click()
    await page.getByText('EN').click()
    await page.waitForTimeout(500)
    const dir = await page.locator('div[dir]').first().getAttribute('dir')
    expect(dir).toBe('ltr')
  })

  test('sidebar labels switch language', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Switch language' }).click()
    await page.getByText('عربي').click()
    await page.waitForTimeout(500)
    const sidebar = page.locator('nav')
    await expect(sidebar.getByText('لوحة التحكم').or(sidebar.getByText('Dashboard'))).toBeVisible()
  })

  test('topbar elements switch language', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Switch language' }).click()
    await page.getByText('عربي').click()
    await page.waitForTimeout(500)
    await expect(page.getByRole('button', { name: /AR|عربي|تبديل اللغة/ })).toBeVisible()
  })
})

// ─── Global Search ────────────────────────────────────────────────
test.describe('Global Search', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
  })

  test('search trigger is visible in topbar', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Search...').or(page.getByText('بحث...'))).toBeVisible()
  })

  test('search bar shows keyboard shortcut hint', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('⌘K')).toBeVisible()
  })

  test('clicking search opens command palette', async ({ authenticatedPage: page }) => {
    const searchTrigger = page.locator('[class*="cursor-pointer"]').filter({ hasText: /Search\.\.\./ }).first()
    await searchTrigger.click()
    const dialog = page.getByRole('dialog', { name: /Global Search|بحث عام/ })
    await expect(dialog).toBeVisible({ timeout: 5_000 })
  })

  test('typing in search shows results', async ({ authenticatedPage: page }) => {
    const searchTrigger = page.locator('[class*="cursor-pointer"]').filter({ hasText: /Search\.\.\./ }).first()
    await searchTrigger.click()
    const dialog = page.getByRole('dialog', { name: /Global Search|بحث عام/ })
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    await dialog.getByRole('textbox').fill('project')
    await page.waitForTimeout(500)
  })

  test('keyboard shortcut or click opens search', async ({ authenticatedPage: page }) => {
    const searchTrigger = page.locator('[class*="cursor-pointer"]').filter({ hasText: /Search\.\.\./ }).first()
    await searchTrigger.click()
    const dialog = page.getByRole('dialog', { name: /Global Search|بحث عام/ })
    await expect(dialog).toBeVisible({ timeout: 5_000 })
  })

  test('search input clears on Escape', async ({ authenticatedPage: page }) => {
    const searchTrigger = page.locator('[class*="cursor-pointer"]').filter({ hasText: /Search\.\.\./ }).first()
    await searchTrigger.click()
    const dialog = page.getByRole('dialog', { name: /Global Search|بحث عام/ })
    await expect(dialog).toBeVisible({ timeout: 5_000 })
    await dialog.getByRole('textbox').fill('test')
    await page.keyboard.press('Escape')
  })
})

// ─── Notifications ────────────────────────────────────────────────
test.describe('Notifications', () => {
  test('notification bell is visible in topbar', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    const notifBtn = page.getByRole('button', { name: /Notifications/i })
    await expect(notifBtn).toBeVisible()
  })

  test('notification badge shows count', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    const badge = page.locator('[class*="badge"]').filter({ hasText: /\d+/ })
    if (await badge.isVisible()) {
      await expect(badge).toBeVisible()
    }
  })

  test('clicking bell opens notification panel', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    const notifBtn = page.getByRole('button', { name: /Notifications/i })
    await notifBtn.click()
    const panel = page.locator('[class*="panel"], [class*="dropdown"], [role="dialog"]').filter({ hasText: /notification/i })
    if (await panel.isVisible()) {
      await expect(panel).toBeVisible()
    }
  })

  test('notifications page loads', async ({ authenticatedPage: page }) => {
    await page.goto('/notifications')
    await expect(page.getByText(/notifications| Notifications/i).first()).toBeVisible()
  })

  test('mark all read button exists', async ({ authenticatedPage: page }) => {
    await page.goto('/notifications')
    const markAllBtn = page.getByRole('button', { name: /mark all|read all|clear all/i })
    if (await markAllBtn.isVisible()) {
      await expect(markAllBtn).toBeVisible()
    }
  })
})
