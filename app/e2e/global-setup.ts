import { chromium, type FullConfig } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import { e2eEnvironment } from './environment'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const AUTH_FILE = path.join(__dirname, '.auth', 'user.json')

async function globalSetup(config: FullConfig) {
  const authDir = path.dirname(AUTH_FILE)
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true })
  }

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  const baseURL = config.projects[0].use.baseURL as string

  await page.goto(`${baseURL}/login`)
  await page.getByRole('textbox', { name: 'Email' }).fill(e2eEnvironment.email)
  await page.getByRole('textbox', { name: 'Password' }).fill(e2eEnvironment.password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL('**/dashboard', { timeout: 30_000 })

  await page.context().storageState({ path: AUTH_FILE })
  await browser.close()
}

export default globalSetup
