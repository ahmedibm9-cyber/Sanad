import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { login } from './fixtures/auth'

const PAGES_TO_CHECK = [
  { name: 'Login', path: '/login', authenticated: false },
  { name: 'Dashboard', path: '/dashboard', authenticated: true },
  { name: 'Customers', path: '/customers', authenticated: true },
  { name: 'Projects', path: '/projects', authenticated: true },
  { name: 'Documents', path: '/documents', authenticated: true },
] as const

for (const { name, path, authenticated } of PAGES_TO_CHECK) {
  test.describe(`${name} page`, () => {
    test.beforeEach(async ({ page }) => {
      if (authenticated) {
        await login(page)
      }
      await page.goto(path)
      await page.waitForLoadState('networkidle')
    })

    test(`has no critical or serious a11y violations on ${name}`, async ({ page }) => {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      const critical = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      )

      const report = critical
        .map(
          (v) =>
            `[${v.impact}] ${v.id}: ${v.description}\n  Help: ${v.helpUrl}\n  Elements: ${v.nodes.map((n) => n.target.join(', ')).join('\n  ')}`,
        )
        .join('\n\n')

      expect(
        critical.length,
        `Found ${critical.length} critical/serious a11y violations:\n\n${report}`,
      ).toBe(0)
    })

    test(`has no moderate a11y violations on ${name}`, async ({ page }) => {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      const moderate = results.violations.filter((v) => v.impact === 'moderate')

      if (moderate.length > 0) {
        const report = moderate
          .map(
            (v) =>
              `[${v.impact}] ${v.id}: ${v.description}\n  Help: ${v.helpUrl}\n  Elements: ${v.nodes.map((n) => n.target.join(', ')).join('\n  ')}`,
          )
          .join('\n\n')

        console.warn(`Moderate a11y violations on ${name}:\n\n${report}`)
      }

      expect(
        moderate.length,
        `Found ${moderate.length} moderate a11y violations`,
      ).toBe(0)
    })
  })
}
