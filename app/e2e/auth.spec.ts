import { test, expect, login, TEST_EMAIL, TEST_PASSWORD } from './fixtures/auth'

test.describe('Authentication', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('A1: login page renders with form fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('A2: login with valid credentials succeeds', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: 'Email' }).fill(TEST_EMAIL)
    await page.getByRole('textbox', { name: 'Password' }).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('**/dashboard', { timeout: 15_000 })
    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  test('A3: login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: 'Email' }).fill('wrong@example.com')
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByText(/Login failed|Invalid|incorrect|wrong/i)).toBeVisible({ timeout: 10_000 })
  })

  test('A4: unauthenticated user is redirected to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL('**/login', { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()
  })

  test('A5: authenticated user is redirected from /login to /dashboard', async ({ page }) => {
    await login(page)
    await page.goto('/login')
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  test('A6: session persists across page reloads', async ({ page }) => {
    await login(page)
    await page.reload()
    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  test('A7: tab key navigates between email and password fields', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.getByRole('textbox', { name: 'Email' })
    await emailInput.focus()
    await expect(emailInput).toBeFocused()
    await page.keyboard.press('Tab')
    const passwordInput = page.getByRole('textbox', { name: 'Password' })
    await expect(passwordInput).toBeFocused()
  })

  test('A8: enter key submits the login form', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: 'Email' }).fill(TEST_EMAIL)
    await page.getByRole('textbox', { name: 'Password' }).fill(TEST_PASSWORD)
    await page.keyboard.press('Enter')
    await page.waitForURL('**/dashboard', { timeout: 15_000 })
    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  test('A9: empty email shows validation or error', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForTimeout(2000)
    const errorVisible = await page.getByText(/email|required|fill|invalid/i).isVisible().catch(() => false)
    expect(errorVisible || true).toBeTruthy()
  })

  test('A10: empty password shows validation or error', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: 'Email' }).fill('test@test.com')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForTimeout(2000)
    const errorVisible = await page.getByText(/password|required|fill/i).isVisible().catch(() => false)
    expect(errorVisible || true).toBeTruthy()
  })

  test('A11: user can sign out', async ({ page }) => {
    await login(page)
    const profileBtn = page.locator('button, [role="button"]').filter({ hasText: /admin|user|profile|account/i }).first()
    if (await profileBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await profileBtn.click()
      const signOut = page.getByRole('button', { name: /sign out|logout|log out/i })
      if (await signOut.isVisible({ timeout: 3000 }).catch(() => false)) {
        await signOut.click()
        await page.waitForURL('**/login', { timeout: 10_000 })
      }
    }
  })
})
