import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const BASE_URL = process.env.BASE_URL || 'https://app-wine-three-38.vercel.app'
const AUTH_FILE = path.join(__dirname, 'e2e', '.auth', 'user.json')

export default defineConfig({
  testDir: './e2e',
  testMatch: 'sanad.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  globalSetup: './e2e/global-setup',
  globalTeardown: './e2e/global-teardown',
  use: {
    baseURL: BASE_URL,
    storageState: AUTH_FILE,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
