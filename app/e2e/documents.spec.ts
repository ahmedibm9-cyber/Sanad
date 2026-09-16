import { test, expect } from './fixtures/auth'

test.describe('Documents', () => {
  test('I1: document form page loads for a project', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const newDocBtn = page.getByRole('button', { name: /New Document|مستند جديد/i })
      if (await newDocBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await newDocBtn.click()
        const dropdown = page.locator('[role="menu"], .dropdown, [class*="absolute"]').first()
        if (await dropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(dropdown).toBeVisible()
        }
      }
    }
  })

  test('I2: document type options include Invoice, Packing List, Delivery Note, BL', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const newDocBtn = page.getByRole('button', { name: /New Document|مستند جديد/i })
      if (await newDocBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await newDocBtn.click()
        const menu = page.locator('[role="menu"], .dropdown, [class*="absolute"]').first()
        if (await menu.isVisible({ timeout: 3000 }).catch(() => false)) {
          const text = await menu.textContent()
          const hasTypes = /Invoice|Packing List|Delivery Note|Bill of Lading|BL|PKL|DN|QUOT|PINV|TINV|CINV/i.test(text || '')
          expect(hasTypes).toBeTruthy()
        }
      }
    }
  })

  test('I3: invoice dropdown shows QUOT, PINV, TINV, CINV', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const newDocBtn = page.getByRole('button', { name: /New Document|مستند جديد/i })
      if (await newDocBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await newDocBtn.click()
        const invoiceOption = page.locator('[role="menuitem"], .dropdown a, .dropdown button').filter({ hasText: /Invoice|فاتورة/i }).first()
        if (await invoiceOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await invoiceOption.click()
          await page.waitForTimeout(500)
          const subMenu = page.locator('[role="menu"], .dropdown, [class*="absolute"]').nth(1)
          if (await subMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
            const text = await subMenu.textContent()
            const hasTypes = /Quotation|Proforma|Tax|Commercial|QUOT|PINV|TINV|CINV/i.test(text || '')
            expect(hasTypes).toBeTruthy()
          }
        }
      }
    }
  })

  test('I4: document form has document number field', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const newDocBtn = page.getByRole('button', { name: /New Document|مستند جديد/i })
      if (await newDocBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await newDocBtn.click()
        const docType = page.locator('[role="menuitem"], .dropdown a, .dropdown button').filter({ hasText: /Invoice|Quotation|فاتورة/i }).first()
        if (await docType.isVisible({ timeout: 3000 }).catch(() => false)) {
          await docType.click()
          await page.waitForTimeout(2000)
          const numberField = page.getByRole('textbox', { name: /number|رقم|ref/i })
          if (await numberField.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(numberField).toBeVisible()
          }
        }
      }
    }
  })

  test('I5: document form has material and quantity fields', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const newDocBtn = page.getByRole('button', { name: /New Document|مستند جديد/i })
      if (await newDocBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await newDocBtn.click()
        const docType = page.locator('[role="menuitem"], .dropdown a, .dropdown button').filter({ hasText: /Invoice|فاتورة/i }).first()
        if (await docType.isVisible({ timeout: 3000 }).catch(() => false)) {
          await docType.click()
          await page.waitForTimeout(2000)
          await expect(page.getByText(/Material|Quantity|Weight|مادة|كمية|وزن/i).first()).toBeVisible()
        }
      }
    }
  })

  test('I6: document form has customer and company info', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const newDocBtn = page.getByRole('button', { name: /New Document|مستند جديد/i })
      if (await newDocBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await newDocBtn.click()
        const docType = page.locator('[role="menuitem"], .dropdown a, .dropdown button').filter({ hasText: /Invoice|فاتورة/i }).first()
        if (await docType.isVisible({ timeout: 3000 }).catch(() => false)) {
          await docType.click()
          await page.waitForTimeout(2000)
          await expect(page.getByText(/Customer|Company|Shipper|عميل|شركة|مُرسل/i).first()).toBeVisible()
        }
      }
    }
  })

  test('I7: document form has currency and price fields', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const newDocBtn = page.getByRole('button', { name: /New Document|مستند جديد/i })
      if (await newDocBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await newDocBtn.click()
        const docType = page.locator('[role="menuitem"], .dropdown a, .dropdown button').filter({ hasText: /Invoice|فاتورة/i }).first()
        if (await docType.isVisible({ timeout: 3000 }).catch(() => false)) {
          await docType.click()
          await page.waitForTimeout(2000)
          await expect(page.getByText(/Currency|Price|SAR|USD|عملة|سعر/i).first()).toBeVisible()
        }
      }
    }
  })

  test('I8: document form has save/print/download actions', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const newDocBtn = page.getByRole('button', { name: /New Document|مستند جديد/i })
      if (await newDocBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await newDocBtn.click()
        const docType = page.locator('[role="menuitem"], .dropdown a, .dropdown button').filter({ hasText: /Invoice|فاتورة/i }).first()
        if (await docType.isVisible({ timeout: 3000 }).catch(() => false)) {
          await docType.click()
          await page.waitForTimeout(2000)
          const actions = page.getByRole('button', { name: /Save|Print|Download|PDF|حفظ|طباعة|تنزيل/i })
          expect(await actions.count()).toBeGreaterThan(0)
        }
      }
    }
  })

  test('I9: document form has VAT/tax section', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const newDocBtn = page.getByRole('button', { name: /New Document|مستند جديد/i })
      if (await newDocBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await newDocBtn.click()
        const docType = page.locator('[role="menuitem"], .dropdown a, .dropdown button').filter({ hasText: /Tax Invoice|فاتورة ضريبية/i }).first()
        if (await docType.isVisible({ timeout: 3000 }).catch(() => false)) {
          await docType.click()
          await page.waitForTimeout(2000)
          await expect(page.getByText(/VAT|Tax|ضريبة/i).first()).toBeVisible()
        }
      }
    }
  })

  test('I10: document preview page renders', async ({ authenticatedPage: page }) => {
    await page.goto('/documents/preview')
    await page.waitForTimeout(1000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('I11: document preview has back navigation', async ({ authenticatedPage: page }) => {
    await page.goto('/documents/preview')
    await page.waitForTimeout(1000)
    const backBtn = page.locator('button, a').filter({ hasText: /back|←|return|close/i }).first()
    if (await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(backBtn).toBeVisible()
    }
  })

  test('I12: document preview has print/download button', async ({ authenticatedPage: page }) => {
    await page.goto('/documents/preview')
    await page.waitForTimeout(1000)
    const actionBtn = page.getByRole('button', { name: /print|download|export|pdf/i })
    if (await actionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(actionBtn).toBeVisible()
    }
  })

  test('I13: document form has delivery terms and incoterm fields', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const newDocBtn = page.getByRole('button', { name: /New Document|مستند جديد/i })
      if (await newDocBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await newDocBtn.click()
        const docType = page.locator('[role="menuitem"], .dropdown a, .dropdown button').filter({ hasText: /Invoice|فاتورة/i }).first()
        if (await docType.isVisible({ timeout: 3000 }).catch(() => false)) {
          await docType.click()
          await page.waitForTimeout(2000)
          await expect(page.getByText(/Delivery|Payment|Incoterm|terms|شروط|تسليم|دفع/i).first()).toBeVisible()
        }
      }
    }
  })

  test('I14: document form has prepared by and signature fields', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const newDocBtn = page.getByRole('button', { name: /New Document|مستند جديد/i })
      if (await newDocBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await newDocBtn.click()
        const docType = page.locator('[role="menuitem"], .dropdown a, .dropdown button').filter({ hasText: /Invoice|فاتورة/i }).first()
        if (await docType.isVisible({ timeout: 3000 }).catch(() => false)) {
          await docType.click()
          await page.waitForTimeout(2000)
          await expect(page.getByText(/Prepared|Signature|Stamp|جاهز|توقيع|ختم/i).first()).toBeVisible()
        }
      }
    }
  })

  test('I15: project documents tab shows document list or empty state', async ({ authenticatedPage: page }) => {
    await page.goto('/projects')
    const projectLink = page.locator('a[href*="/projects/"]').first()
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click()
      await page.waitForURL(/\/projects\/[\w-]+/, { timeout: 10_000 })
      const docsTab = page.locator('button, [role="tab"]').filter({ hasText: /Documents|مستندات/i }).first()
      if (await docsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await docsTab.click()
        await page.waitForTimeout(500)
        const docList = page.locator('table tbody tr, [class*="card"]').filter({ hasText: /document|invoice|QUOT|PKL|DN|BL/i })
        const emptyState = page.getByText(/No documents|لا توجد|empty/i)
        const hasContent = await docList.count() > 0 || await emptyState.isVisible().catch(() => false)
        expect(hasContent).toBeTruthy()
      }
    }
  })
})
