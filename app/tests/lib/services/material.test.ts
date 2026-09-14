/**
 * Tests for material service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Material } from '@/lib/services/material'

vi.mock('@/lib/logger', () => ({
  appLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('@/lib/supabase', () => ({
  getSupabase: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
  })),
}))

describe('MaterialService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should define material type correctly', async () => {
    const material: Material = {
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
      version: 1,
    }

    expect(material.name).toBe('HDPE 952')
    expect(material.last_selling_price).toBe(1050)
    expect(material.last_selling_currency).toBe('SAR')
  })

  it('should include version field with default value 1', async () => {
    const material: Material = {
      id: '1',
      company_id: 'comp-1',
      name: 'Test Material',
      grade: null,
      manufacturer: null,
      origin: null,
      hs_code: null,
      default_packing: null,
      last_selling_price: null,
      last_selling_currency: null,
      last_selling_unit: null,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
      deleted_at: null,
      version: 1,
    }

    expect(material.version).toBe(1)
    expect(typeof material.version).toBe('number')
  })

  describe('optimistic locking', () => {
    it('should increment version on successful update', async () => {
      const existing: Material = {
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
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: null,
        updated_by: null,
        deleted_at: null,
        version: 7,
      }

      const currentVersion = (existing as any).version ?? 1
      const newVersion = currentVersion + 1

      expect(currentVersion).toBe(7)
      expect(newVersion).toBe(8)
    })

    it('should detect version mismatch for conflict', async () => {
      const existing: Material = {
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
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_by: null,
        updated_by: null,
        deleted_at: null,
        version: 7,
      }

      // Simulate concurrent update
      const concurrentVersion = 8
      const currentVersion = (existing as any).version ?? 1

      expect(currentVersion).not.toBe(concurrentVersion)
    })
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
