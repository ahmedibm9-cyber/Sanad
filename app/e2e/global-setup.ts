import { chromium, type FullConfig } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@sanad.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || '123456789'
const AUTH_FILE = path.join(__dirname, '.auth', 'user.json')

async function globalSetup(config: FullConfig) {
  const authDir = path.dirname(AUTH_FILE)
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true })
  }

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  const baseURL = config.projects[0].use.baseURL as string
  console.log(`[global-setup] Navigating to ${baseURL}/login`)

  await page.goto(`${baseURL}/login`, { timeout: 60_000 })
  console.log(`[global-setup] Page loaded. URL: ${page.url()}`)
  console.log(`[global-setup] Page title: ${await page.title()}`)

  // Check if we landed on a Vercel auth/protection page instead of the app
  const pageContent = await page.textContent('body')
  if (pageContent && (pageContent.includes('Authentication Required') || pageContent.includes('Vercel'))) {
    console.error(`[global-setup] ERROR: Landed on Vercel protection page, not the app!`)
    console.error(`[global-setup] Page content (first 500 chars): ${pageContent.substring(0, 500)}`)
    await browser.close()
    throw new Error('Vercel deployment protection is blocking CI access. Disable it in Vercel dashboard → Settings → Deployment Protection.')
  }

  console.log(`[global-setup] Filling email: ${TEST_EMAIL}`)
  await page.getByRole('textbox', { name: 'Email' }).fill(TEST_EMAIL)
  await page.getByRole('textbox', { name: 'Password' }).fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  console.log(`[global-setup] Clicked Sign In, waiting for dashboard...`)

  await page.waitForURL('**/dashboard', { timeout: 30_000 })
  console.log(`[global-setup] Logged in successfully. URL: ${page.url()}`)

  await page.context().storageState({ path: AUTH_FILE })
  console.log(`[global-setup] Auth state saved to ${AUTH_FILE}`)
  await browser.close()
}

export default globalSetup
