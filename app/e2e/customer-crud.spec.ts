import { test, expect } from './fixtures/auth'

const TEST_CUSTOMER_NAME = `E2E CRUD ${Date.now()}`
const EDITED_NAME = `${TEST_CUSTOMER_NAME} Edited`

test.describe('Customer CRUD cycle', () => {
  test('Create → Verify → Edit → Delete a customer', async ({ authenticatedPage: page }) => {
    try {
      // ── CREATE ──
      await page.goto('/customers')
      await page.getByText(/Loading/).waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})

      await page.getByRole('button', { name: /Add Customer|عميل جديد|New Customer/i }).click()
      const modal = page.getByRole('dialog').filter({ hasText: /Add New Customer|إضافة عميل جديد/i }).first()
      await expect(modal).toBeVisible({ timeout: 5_000 })

      // CustomerFormModal labels are not associated with their inputs, so the
      // actual accessible structure exposes these as unnamed textboxes.
      const inputs = modal.getByRole('textbox')
      await inputs.nth(0).fill(TEST_CUSTOMER_NAME)
      await inputs.nth(4).fill('+971501234567')
      await inputs.nth(6).fill('e2e-test@example.com')

      await modal.getByRole('button', { name: /Create Customer|إنشاء العميل/i }).click()
      await page.waitForTimeout(2000)

      // ── VERIFY it appears in the list ──
      await page.goto('/customers')
      await page.getByText(/Loading/).waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})
      await page.waitForTimeout(1000)

      await page.getByPlaceholder(/Search|بحث/).fill(TEST_CUSTOMER_NAME)
      const customerRow = page.locator('table tbody tr').filter({ hasText: TEST_CUSTOMER_NAME }).first()
      await expect(customerRow).toBeVisible({ timeout: 10_000 })

      // ── EDIT ──
      await customerRow.getByRole('button', { name: /Edit customer|تعديل العميل/i }).click()
      const editModal = page.getByRole('dialog').filter({ hasText: /Edit Customer|تعديل العميل/i }).first()
      await expect(editModal).toBeVisible({ timeout: 5_000 })

      const editNameInput = editModal.getByRole('textbox').first()
      await editNameInput.fill(EDITED_NAME)
      await editModal.getByRole('button', { name: /Save Changes|حفظ التغييرات/i }).click()
      await page.waitForTimeout(2000)

      // ── VERIFY edited name appears ──
      await page.goto('/customers')
      await page.getByText(/Loading/).waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})
      await page.waitForTimeout(1000)

      await page.getByPlaceholder(/Search|بحث/).fill(EDITED_NAME)
      const editedRow = page.locator('table tbody tr').filter({ hasText: EDITED_NAME }).first()
      await expect(editedRow).toBeVisible({ timeout: 10_000 })

      // ── DELETE ──
      await editedRow.getByRole('button', { name: /Delete customer|حذف العميل/i }).click()
      const confirmModal = page.getByRole('dialog').filter({ hasText: /Move to Trash|نقل إلى سلة المهملات/i }).first()
      await expect(confirmModal).toBeVisible({ timeout: 5_000 })
      await confirmModal.getByRole('button', { name: /Move to Trash|نقل إلى سلة المهملات/i }).click()
      await page.waitForTimeout(2000)

      // ── VERIFY deleted customer no longer appears ──
      await page.goto('/customers')
      await page.getByText(/Loading/).waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})
      await page.waitForTimeout(1000)
      await page.getByPlaceholder(/Search|بحث/).fill(EDITED_NAME)
      await expect(page.locator('table tbody tr').filter({ hasText: EDITED_NAME })).toHaveCount(0, { timeout: 10_000 })
    } finally {
      // Keep this test isolated even when an assertion fails mid-cycle.
      await page.goto('/customers').catch(() => {})
      await page.getByText(/Loading/).waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})
      for (const name of [EDITED_NAME, TEST_CUSTOMER_NAME]) {
        await page.getByPlaceholder(/Search|بحث/).fill(name).catch(() => {})
        const row = page.locator('table tbody tr').filter({ hasText: name }).first()
        if (await row.isVisible().catch(() => false)) {
          await row.getByRole('button', { name: /Delete customer|حذف العميل/i }).click()
          const confirmModal = page.getByRole('dialog').filter({ hasText: /Move to Trash|نقل إلى سلة المهملات/i }).first()
          await confirmModal.getByRole('button', { name: /Move to Trash|نقل إلى سلة المهملات/i }).click()
          await page.waitForTimeout(1000)
        }
      }
    }
  })
})
