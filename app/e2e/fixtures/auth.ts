import { test as base, expect } from '@playwright/test'
import { e2eEnvironment } from '../environment'

const TEST_EMAIL = e2eEnvironment.email
const TEST_PASSWORD = e2eEnvironment.password

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByRole('textbox', { name: 'Email' }).fill(TEST_EMAIL)
  await page.getByRole('textbox', { name: 'Password' }).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL('**/dashboard', { timeout: 15_000 })
}

const test = base.extend<{ authenticatedPage: import('@playwright/test').Page }>({
  authenticatedPage: async ({ page }, use) => {
    await use(page)
  },
})

export { test, expect, login, TEST_EMAIL, TEST_PASSWORD }
