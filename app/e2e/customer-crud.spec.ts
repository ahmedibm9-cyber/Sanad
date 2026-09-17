import { test, expect } from './fixtures/auth'

const TEST_CUSTOMER_NAME = `E2E CRUD ${Date.now()}`
const EDITED_NAME = `${TEST_CUSTOMER_NAME} Edited`

test.describe('Customer CRUD cycle', () => {
  test('Create → Verify → Edit → Delete a customer', async ({ authenticatedPage: page }) => {
    // ── CREATE ──
    await page.goto('/customers')
    await page.getByText(/Loading/).waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})

    await page.getByRole('button', { name: /Add Customer|عميل جديد|New Customer/i }).click()
    const modal = page.locator('[role="dialog"], .fixed, .modal').first()
    await expect(modal).toBeVisible({ timeout: 5_000 })

    const nameInput = modal.getByRole('textbox', { name: /name|اسم/i }).first()
    await nameInput.fill(TEST_CUSTOMER_NAME)

    const phoneInput = modal.getByRole('textbox', { name: /phone|هاتف/i }).first()
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill('+971501234567')
    }

    const emailInput = modal.getByRole('textbox', { name: /email|بريد/i }).first()
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('e2e-test@example.com')
    }

    const saveBtn = modal.getByRole('button', { name: /Save|Create|إضافة|حفظ/i }).first()
    await saveBtn.click()
    await page.waitForTimeout(2000)

    // ── VERIFY it appears in the list ──
    await page.goto('/customers')
    await page.getByText(/Loading/).waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})
    await page.waitForTimeout(1000)

    const customerRow = page.locator('table tbody tr, [class*="card"]').filter({ hasText: TEST_CUSTOMER_NAME })
    await expect(customerRow.first()).toBeVisible({ timeout: 10_000 })

    // ── EDIT ──
    const editBtn = customerRow.first().getByRole('button', { name: /Edit|تعديل/i }).first()
    await editBtn.click()
    const editModal = page.locator('[role="dialog"], .fixed, .modal').first()
    await expect(editModal).toBeVisible({ timeout: 5_000 })

    const editNameInput = editModal.getByRole('textbox', { name: /name|اسم/i }).first()
    await editNameInput.clear()
    await editNameInput.fill(EDITED_NAME)

    const updateBtn = editModal.getByRole('button', { name: /Save|Update|تحديث|حفظ/i }).first()
    await updateBtn.click()
    await page.waitForTimeout(2000)

    // ── VERIFY edited name appears ──
    await page.goto('/customers')
    await page.getByText(/Loading/).waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})
    await page.waitForTimeout(1000)

    const editedRow = page.locator('table tbody tr, [class*="card"]').filter({ hasText: EDITED_NAME })
    await expect(editedRow.first()).toBeVisible({ timeout: 10_000 })

    // ── DELETE ──
    const deleteBtn = editedRow.first().getByRole('button', { name: /Delete|حذف/i }).first()
    await deleteBtn.click()

    const confirmModal = page.locator('[role="dialog"], .fixed, .modal').first()
    await expect(confirmModal).toBeVisible({ timeout: 5_000 })

    const confirmDeleteBtn = confirmModal.getByRole('button', { name: /Trash|Delete|حذف|نقل/i }).first()
    await confirmDeleteBtn.click()
    await page.waitForTimeout(2000)

    // ── VERIFY deleted customer no longer appears ──
    await page.goto('/customers')
    await page.getByText(/Loading/).waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {})
    await page.waitForTimeout(1000)

    const deletedRow = page.locator('table tbody tr, [class*="card"]').filter({ hasText: EDITED_NAME })
    await expect(deletedRow).toHaveCount(0, { timeout: 10_000 })
  })
})
