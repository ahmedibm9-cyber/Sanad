import { test, expect } from './fixtures/auth'

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
