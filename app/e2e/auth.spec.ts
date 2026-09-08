import { test, expect, login, TEST_EMAIL, TEST_PASSWORD } from './fixtures/auth'

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
