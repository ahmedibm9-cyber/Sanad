/**
 * Tests for report service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('ReportService', () => {
  let service: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const { ReportService } = await import('@/lib/services/report')
    service = new ReportService()
  })

  it('should return available report types', () => {
    const types = service.getReportTypes()
    expect(types.length).toBeGreaterThan(0)
    
    const typeIds = types.map((t: any) => t.id)
    expect(typeIds).toContain('projects_by_status')
    expect(typeIds).toContain('documents_register')
    expect(typeIds).toContain('audit_report')
  })

  it('should have English and Arabic labels for all report types', () => {
    const types = service.getReportTypes()
    types.forEach((type: any) => {
      expect(type.name).toBeTruthy()
      expect(type.nameAr).toBeTruthy()
    })
  })
})
