import { test as base, expect } from '@playwright/test'
import { e2eEnvironment } from '../environment'
import { cleanupTestData } from './cleanup'

const TEST_EMAIL = e2eEnvironment.email
const TEST_PASSWORD = e2eEnvironment.password

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  try {
    await page.waitForURL('**/dashboard', { timeout: 10_000 })
    return
  } catch {
    // Not redirected — need to fill the login form
  }
  await page.getByRole('textbox', { name: 'Email' }).fill(TEST_EMAIL)
  await page.getByRole('textbox', { name: 'Password' }).fill(TEST_PASSWORD)
  const signInBtn = page.getByRole('button', { name: 'Sign In' })
  await signInBtn.waitFor({ state: 'visible', timeout: 15_000 })
  for (let i = 0; i < 30; i++) {
    const disabled = await signInBtn.evaluate((el: HTMLButtonElement) => el.disabled)
    if (!disabled) break
    await page.waitForTimeout(500)
  }
  await signInBtn.click()
  await page.waitForURL('**/dashboard', { timeout: 30_000 })
}

const test = base.extend<{ authenticatedPage: import('@playwright/test').Page }>({
  authenticatedPage: async ({ page }, use) => {
    await login(page)
    await use(page)
    await cleanupTestData()
  },
})

export { test, expect, login, TEST_EMAIL, TEST_PASSWORD }
