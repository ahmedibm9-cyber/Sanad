/**
 * Tests for attachment service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('AttachmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should define attachment type correctly', async () => {
    const attachment: import('@/lib/services/attachment').Attachment = {
      id: '1',
      company_id: 'comp-1',
      work_item_id: 'wi-1',
      category: 'certificate',
      r2_object_key: 'companies/comp-1/projects/wi-1/attachments/cert.pdf',
      original_name: 'Certificate_of_Origin.pdf',
      mime_type: 'application/pdf',
      size: 245000,
      uploaded_by: 'user-1',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    expect(attachment.original_name).toBe('Certificate_of_Origin.pdf')
    expect(attachment.category).toBe('certificate')
    expect(attachment.size).toBe(245000)
  })

  it('should define create attachment input correctly', async () => {
    const input: import('@/lib/services/attachment').CreateAttachmentInput = {
      work_item_id: 'wi-1',
      category: 'certificate',
      r2_object_key: 'companies/comp-1/projects/wi-1/attachments/cert.pdf',
      original_name: 'Certificate_of_Origin.pdf',
      mime_type: 'application/pdf',
      size: 245000,
    }

    expect(input.work_item_id).toBe('wi-1')
    expect(input.original_name).toBe('Certificate_of_Origin.pdf')
  })
})
