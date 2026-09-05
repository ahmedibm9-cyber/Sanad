/**
 * Tests for material service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('MaterialService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should define material type correctly', async () => {
    const material: import('@/lib/services/material').Material = {
      id: '1',
      company_id: 'comp-1',
      name: 'HDPE 952',
      grade: 'Blow Molding',
      manufacturer: 'SABIC',
      origin: 'Saudi Arabia',
      hs_code: '3901.20',
      default_packing: '25 KG Bags',
      last_selling_price: 1050,
      last_selling_currency: 'SAR',
      last_selling_unit: 'MT',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
      deleted_at: null,
    }

    expect(material.name).toBe('HDPE 952')
    expect(material.last_selling_price).toBe(1050)
    expect(material.last_selling_currency).toBe('SAR')
  })

  it('should define material file type correctly', async () => {
    const file: import('@/lib/services/material').MaterialFile = {
      id: '1',
      company_id: 'comp-1',
      material_id: 'mat-1',
      file_type: 'TDS',
      r2_object_key: 'companies/comp-1/materials/mat-1/TDS/tds.pdf',
      original_name: 'HDPE_TDS.pdf',
      mime_type: 'application/pdf',
      size: 1024000,
      uploaded_by: null,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    expect(file.file_type).toBe('TDS')
    expect(file.original_name).toBe('HDPE_TDS.pdf')
  })

  it('should define create material input correctly', async () => {
    const input: import('@/lib/services/material').CreateMaterialInput = {
      name: 'PP 500P',
      grade: 'Injection',
      manufacturer: 'SABIC',
      origin: 'Saudi Arabia',
      hs_code: '3902.10',
      default_packing: '25 KG Bags',
      last_selling_price: 980,
      last_selling_currency: 'SAR',
      last_selling_unit: 'MT',
    }

    expect(input.name).toBe('PP 500P')
    expect(input.last_selling_price).toBe(980)
  })
})
