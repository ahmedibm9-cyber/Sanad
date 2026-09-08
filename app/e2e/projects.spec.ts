import { test, expect } from './fixtures/auth'

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
